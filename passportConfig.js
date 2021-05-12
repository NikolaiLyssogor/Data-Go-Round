const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')

function initPassport(passport, db) {

    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {

        // Look for user
        query = `SELECT * FROM users WHERE email='${email}'`;
        db.any(query)
            .then(data => {
                if (data.length === 0) {
                    return done(null, false, { message: "No registered user with given email." })
                }

                user = data[0]

                bcrypt.compare(password, user.pw_hashed, (err, result) => {

                    if (err) { console.log(err) }

                    if (result) {
                        return done(null, user)
                    }
                    else {
                        return done(null, false, { message: "Incorrect password." })
                    }
                })
            })
            .catch(err => { console.log(err) })

        // const user = getUserByEmail(email, db)
        // console.log(user)

        // if (user.length === 0) {
        //     return done(null, false, { message: "No registered user with given email." })
        // }

        // if (bcrypt.compare(password, user.pw_hashed)) {
        //     return done(null, user)
        // }
        // else {
        //     return done(null, false, { message: "Incorrect password." })
        // }
    }))

    passport.serializeUser((user, done) => {
        done(null, user.user_id)
    })
    passport.deserializeUser((id, done) => {

        // Query to find user by ID
        query = `SELECT * FROM users WHERE user_id=${id}`;

        // Database call
        db.any(query)
            .then(data => {
                 return done(null, data[0]) 
                })
            .catch(err => console.log(err))
    })
}

module.exports = initPassport