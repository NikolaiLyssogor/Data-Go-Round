// --------------------------------------------------------------------------------
// Data-Go-Round Main Server Script
// --------------------------------------------------------------------------------

// Requires
const express = require('express');
const bcrypt = require('bcrypt');
const pgp = require('pg-promise')();
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');

// Load Express
const app = express();
const port = process.env.PORT || 5000; // Use PORT environment variable if present, otherwise use 3000

app.use(methodOverride('_method'))
app.use(bodyParser.json());

// Connect to Heroku database
var dbConfig
if (process.env.DATABASE_URL) {
    dbConfig = process.env.DATABASE_URL
    console.log('Using env URL for database connection')
}
else {
    dbConfig = {
        host: 'localhost',
        port: 5432,
        database: 'dgr',
        user: 'postgres',
        password: 'admin'
    }
    console.log('Using local database connection')
}
var db = pgp(dbConfig);

// --------------------------------------------------------------------------------
// Credits System
// --------------------------------------------------------------------------------

const credsPerSurvey = 10;

// --------------------------------------------------------------------------------
// Passport for user authentication
// --------------------------------------------------------------------------------

// Function to check if user is authenticated
checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {

        return next()
    }
    res.redirect('/login')
}

// Function to check that user is NOT authenticated (for login page)
checkNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/home')
    }
    next()
}

// Get session secret if in production environment, otherwise use dev value
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev secret'

const initPassport = require('./passportConfig')
initPassport(passport, db);
app.use(flash())
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

// Middleware to allow static paths to serve files
app.use(express.static('public'));

// Set view engine to ejs with views in the public folder
app.set('view engine', 'ejs');
app.set('views', './public');

// Get form data in req
app.use(express.urlencoded({ extended: false }));

// --------------------------------------------------------------------------------
// Get Request Handlers for Page Loading
// --------------------------------------------------------------------------------

// Automatic redirect to login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Serve login page
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login');
});

// Serve registration page
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register', { errors: '' })
})

// Serve home page
app.get('/home', checkAuthenticated, (req, res) => {

    // Database call to get all surveys not taken by the current user
    query = `SELECT * FROM surveys WHERE survey_id NOT IN 
    (SELECT survey_id FROM responses WHERE user_id=${req.user.user_id})
    AND creator_id!=${req.user.user_id}`

    db.any(query)
        .then(data => {
            res.render('home-page', { surveys: data, user: req.user })
        })
        .catch(err => {
            console.log(err)
            res.render('home-page', { surveys: '', user: req.user })
        })
})


// Serve my-surveys page
app.get('/my-surveys', checkAuthenticated, (req, res) => {

    // Database call to get all surveys the user created
    query = `SELECT * FROM surveys WHERE creator_id = ${user.user_id}`

    db.any(query)
        .then(data => {
            res.render('my-surveys', { surveys: data, user: user })
        })
        .catch(err => {
            console.log(err)
            res.render('my-surveys', { surveys: '', user: user })
        })
})


// Serve create survey page
app.get('/create', checkAuthenticated, (req, res) => {

    // Check that user has enough credits
    const query = `SELECT credits FROM users WHERE user_id=${user.user_id}`

    // Database Call
    db.any(query)
        .then(data => {
            console.log(data[0].credits)
            if (data[0].credits > credsPerSurvey) {
                // Render page, pass user data
                res.render('create-survey', { user: req.user })
            }
            else {
                res.status(403).send('<h1>403 Forbidden: Insufficient Credits</h1>')
            }
        })
        .catch(err => {
            console.log(err)
            res.redirect('/home')
        })


})

// Serve survey-taking page
app.get('/take/:id', checkAuthenticated, (req, res) => {

    // Check that user hasn't already taken this survey
    query = `SELECT * FROM responses WHERE user_id=${req.user.user_id} AND survey_id=${req.params.id};`
    db.any(query)
        .then(data => {
            if (data.length === 0) {
                const survey_id = req.params.id

                // Create database query to get true false questions
                tf_query = `SELECT 'tf' AS type, tf_questions.question_id, tf_questions.question
                FROM tf_questions WHERE survey_id=${survey_id};`

                // Query to get multiple choice questions
                radio_query = `SELECT 'radio' as type, mc_radio_questions.question_id, mc_radio_questions.question, mc_radio_questions.choices
                FROM mc_radio_questions WHERE survey_id=${survey_id};`

                // Query to get multiple select questions
                checkbox_query = `SELECT 'checkbox' as type, ms_checkbox_questions.question_id, ms_checkbox_questions.question, ms_checkbox_questions.choices
                FROM ms_checkbox_questions WHERE survey_id=${survey_id};`

                db.task('get-everything', task => {
                    return task.batch([
                        task.any(tf_query),
                        task.any(radio_query),
                        task.any(checkbox_query)
                    ])
                })
                    .then(data => {

                        // Create an array with all questions, sorted in order
                        var questions = data[0].concat(data[1], data[2])
                        questions.sort((a, b) => (a.question_id > b.question_id) ? 1 : -1)

                        // Check that the survey actually exists...
                        if (questions.length === 0) { res.status(404).send('<h1>404: Survey does not exist.</h1>') }
                        else { res.render('take-survey', { user: req.user, questions: questions, survey_id: survey_id }) }

                    })
            }
            else {
                res.status(403).send('<h1>403 Forbidden</h1>')
            }
        })
        .catch(err => console.log(err))


})

// --------------------------------------------------------------------------------
// Form data + misc. routing
// --------------------------------------------------------------------------------

// Login handler
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
}))

// Registration handler
app.post('/register', (req, res) => {
    // TODO error checking and input validation

    // Check if email is taken
    query = `SELECT * FROM users WHERE email='${req.body.email}'`;

    var errors = { 'email': false, 'pw': false }

    // Database call to check if user exists
    db.any(query)
        .then(data => {
            if (data.length > 0) {
                console.log(data)
                errors.email = true
            }

            // Check if passwords match
            if (req.body.pw1 !== req.body.pw2) { errors.pw = true }

            // If there's an issue, re-render the register page with errors
            // Otherwise, redirect to the login page and add the new user to the database
            if (errors.email || errors.pw) {
                res.render('register', { errors })
            }
            else {
                // Hash password
                bcrypt.hash(req.body.pw1, 10, (err, hash) => {

                    // Create database query to add user
                    query = `INSERT INTO users (name,email,pw_hashed)
                            VALUES ('${req.body.name}','${req.body.email}','${hash}');`
                    db.any(query).catch(err => console.log(err))
                })

                res.render('login')
                res.end()
            }
        })
        .catch(err => console.log(err))
});

// Survey taking handler
app.post('/take/:id/answers', checkAuthenticated, (req, res) => {

    // Get questions
    const survey_id = req.params.id

    // Create database query to get true false questions
    tf_query = `SELECT 'tf' AS type, tf_questions.question_id, tf_questions.question
    FROM tf_questions WHERE survey_id=${survey_id};`

    // Query to get multiple choice questions
    radio_query = `SELECT 'radio' as type, mc_radio_questions.question_id, mc_radio_questions.question, mc_radio_questions.choices
    FROM mc_radio_questions WHERE survey_id=${survey_id};`

    // Query to get multiple select questions
    checkbox_query = `SELECT 'checkbox' as type, ms_checkbox_questions.question_id, ms_checkbox_questions.question, ms_checkbox_questions.choices
    FROM ms_checkbox_questions WHERE survey_id=${survey_id};`

    db.task('get-everything', task => {
        return task.batch([
            task.any(tf_query),
            task.any(radio_query),
            task.any(checkbox_query)
        ])
    })
        .then(data => {

            // Create an array with all questions, sorted in order
            var questions = data[0].concat(data[1], data[2])
            questions.sort((a, b) => (a.question_id > b.question_id) ? 1 : -1)

            // Check that the survey actually exists...
            if (questions.length !== 0) {

                // Array of queries to send to the database
                var queries = []

                // Loop over questions
                questions.forEach((question) => {

                    // Get the answer from the post req body
                    var qid = question.question_id.toString()
                    var answer = req.body["q" + qid]

                    // Update correct table according to question type
                    switch (question.type) {
                        case "tf":
                            // Case: True/False question
                            if (answer === "True") {
                                queries.push(`UPDATE tf_questions SET res_true=res_true+1 WHERE survey_id=${survey_id} and question_id=${qid}`)
                            }
                            else if (answer === "False") {
                                queries.push(`UPDATE tf_questions SET res_false=res_false+1 WHERE survey_id=${survey_id} and question_id=${qid}`)
                            }
                            break;
                        case "radio":
                            // Case: multiple choice question, i.e. radio select

                            // Get index of answer
                            var idx = 1 + parseInt(answer[1])

                            // Add query to array
                            queries.push(`UPDATE mc_radio_questions SET res[${idx}]=res[${idx}]+1 WHERE survey_id=${survey_id} and question_id=${qid}`)
                            break;
                        case "checkbox":
                            // Case: Multiple select question, i.e. checkbox

                            // Form returns undefined object if no checkboxes are selected
                            if (typeof answer !== 'undefined') {

                                // If only one checkbox is selected, form returns a string instead of an array of strings. To make it easier to universally parse, convert these cases to arrays of length 1
                                if (!Array.isArray(answer)) { answer = [answer] }

                                // Loop over checked boxes and update the relevant response
                                answer.forEach(sel => {

                                    // Index for array in res column
                                    var idx = 1 + parseInt(sel[1])

                                    // Add query
                                    queries.push(`UPDATE ms_checkbox_questions SET res[${idx}]=res[${idx}]+1 WHERE survey_id=${survey_id} and question_id=${qid}`)
                                })
                            }

                    }
                })

                // Add an entry to the "responses" table that the user responded to the given quiz
                queries.push(`INSERT INTO responses(user_id,survey_id) VALUES (${req.user.user_id},${survey_id})`)

                // Add the correct number of credits to the users' total count
                queries.push(`UPDATE users SET credits=credits+${questions.length} WHERE user_id=${req.user.user_id}`)

                // Push all queries to the database server
                queries.forEach(query => db.none(query))

                // Redirect the user to the home page
                // Wait to redirect until the database is updated so that when the home page renders, it knows not to show the quiz which the user just took
                res.redirect('/home')
                res.end()
            }
        })
        .catch(err => {
            console.log(err)
            res.redirect('/home')
            res.end()
        })
})

// Survey create handler
app.post('/create/submit', checkAuthenticated, (req, res) => {

    // Insert the survey into the database and return the new survey's ID
    var makeSurveyQuery = `INSERT INTO surveys(user_id,title,description) VALUES ('${req.user.id}','${req.body.title}','${req.body.description}') RETURNING survey_id`

    db.any(makeSurveyQuery)
        .then(survey_id => {
            var questionQueries = []
            var qid = 1;

            req.body.questions.forEach(q => {
                switch (q.type) {
                    case "tf":
                        questionQueries.push(`INSERT INTO tf_questions(survey_id,question_id,question) VALUES('${survey_id}','${qid}','${q.question}')`)
                    case "radio":

                        // Concat a string of the choices array
                        var choiceStr = ""
                        q.choices.forEach(c => {
                            choiceStr.push(`'${c}',`)
                        })
                        choiceStr.replace(/,$/, "")

                        // Add query
                        questionQueries.push(`INSERT INTO mc_radio_questions(survey_id,question_id,question,choices) VALUES('${survey_id}','${qid}','${q.question}','{${choiceStr}}')`)

                    case "checkbox":

                        // Concat a string of the choices array
                        var choiceStr = ""
                        q.choices.forEach(c => {
                            choiceStr.push(`'${c}',`)
                        })
                        choiceStr.replace(/,$/, "")

                        // Add query
                        questionQueries.push(`INSERT INTO ms_checkbox_questions(survey_id,question_id,question,choices) VALUES('${survey_id}','${qid}','${q.question}','{${choiceStr}}')`)

                }
                qid++
            })
            // Add query to subtract credits from user's account
            questionQueries.push(`UPDATE users SET credits=credits-${req.body.questions.length} WHERE user_id=${req.user.user_id}`)

            // Push all queries to the database server
            questionQueries.forEach(query => db.none(query))

            // Redirect the user to the home page
            // Wait to redirect until the database is updated so that when the home page renders, it knows not to show the quiz which the user just took
            res.send({ "redirectURL": "/home" })
            res.end()
        })
})

// Logout request
app.delete('/logout', (req, res) => {
    req.logOut() // Thanks, Passport!
    res.redirect('/login')
})

app.listen(port, () => console.log(`Listening on port ${port}`));


