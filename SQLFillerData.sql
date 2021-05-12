CREATE TABLE surveys (
    survey_id SERIAL PRIMARY KEY,
    creator_id SERIAL NOT NULL,
    title text,
    description text,
    credits integer DEFAULT 0,
    created timestamp with time zone DEFAULT now(),
    timeout timestamp with time zone
);
ALTER SEQUENCE surveys_survey_id_seq RESTART WITH 41620;
ALTER SEQUENCE surveys_creator_id_seq RESTART WITH 10 INCREMENT BY 10;

INSERT INTO surveys (creator_id, title, description, credits)
VALUES(10, 'SurveyTEST1', 'example description text As a patch of light citizens of distant epochs culture consciousness', 3),
(10, 'SurveyTEST2', 'example description text Sed quia non numquam eius the stars?The carbon in our apple pies.', 2),
(30, 'SurveyTEST3', 'example description text white dwarf concept of the number one. The sky calls to us descended', 2),
(30, 'SurveyTEST4', 'example description text Not a sunrise but a galaxyrise intelligent beings shores and billions ', 5),
(30, 'SurveyTEST5', 'example description text something incredible is waiting to be knownconcept of the number one.', 2),
(40, 'SurveyTEST6', 'example description text Intelligent beings rich in mystery vanquish the impossible.', 0),
(50, 'SurveyTEST7', 'example description text Made in the interiors of collapsing stars cherish that pale blue dot.', 3),
(50, 'SurveyTEST8', 'example description text Trillion vastness is bearable only through love colonies gathered by gravity radio telescope tingling of the spine.', 1),
(10, 'SurveyTEST9', 'example description text vastness is bearable only through love dispassionate extraterrestrial observer.', 1)
;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    pw_hashed text NOT NULL,
    credits integer DEFAULT 0
);

INSERT INTO users (user_id ,name ,email ,pw_hashed)
VALUES(10, 'User111', 'humantvguide@geocities.com', '$2y$10$o.lWv.961abtVattY7NZ7ugB91F4mChQIJhELHkPq4kYZS1TJ/Q6G'),
(20, 'User222', 'goose70@geocities.com', '$2y$10$o.lWv.961abtVattY7NZ7ugB91F4mChQIJhELHkPq4kYZS1TJ/Q6G'),
(30, 'User333', 'castleman@geocities.com', '$2y$10$o.lWv.961abtVattY7NZ7ugB91F4mChQIJhELHkPq4kYZS1TJ/Q6G'),
(40, 'User444', 'pellikaan@geocities.com', '$2y$10$o.lWv.961abtVattY7NZ7ugB91F4mChQIJhELHkPq4kYZS1TJ/Q6G'),
(50, 'User555', 'skyshark@geocities.com', '$2y$10$o.lWv.961abtVattY7NZ7ugB91F4mChQIJhELHkPq4kYZS1TJ/Q6G'),
(60, 'Carter', 'w@w.w', '$2y$10$7jVO51iYPCPqlaGqVLe5yO6A5kefdj4QXCdNXdnW3jovIBLtH8PDy')
;

UPDATE users SET credits=350 where user_id=60;

CREATE TABLE responses (
    user_id integer,
    survey_id integer,
    PRIMARY KEY (user_id,survey_id)
);

INSERT INTO responses (user_id ,survey_id)
VALUES(10, 41620),
(10, 41621),
(30, 41622),
(30, 41623),
(30, 41624),
(40, 41625),
(50, 41626),
(50, 41627),
(10, 41628)
;


CREATE TABLE tf_questions (
    survey_id integer,
    question_id integer,
    question text NOT NULL,
    res_true integer DEFAULT 0,
    res_false integer DEFAULT 0,
    PRIMARY KEY (survey_id,question_id)
);

INSERT INTO tf_questions (survey_id, question_id, question, res_true, res_false )
VALUES(41620,1,'You like hats',7,7),
(41620,2,'The sky is blue',6,8),
(41623,5,'2+2 is 4',12,4),
(41624,1,'Your name is Todd',2,0),
(41626,2,'The world is round',6,7)
;

CREATE TABLE mc_radio_questions (
    survey_id integer,
    question_id integer,
    question text NOT NULL,
    choices text[],
    res integer[],
    PRIMARY KEY (survey_id,question_id)
);



INSERT INTO mc_radio_questions (survey_id, question_id, question,choices, res )
VALUES(41620,3,'Which option do you like best?','{op.1,op.2,op.3,op.4}','{2,2,6,4}'),
(41621,1,'Which number is the luckiest?','{#0,#7,#24,#12}','{0,7,3,0}'),
(41621,2,'The best icecream is:','{vanilla,chocolate,cookie dough,mint chip}','{1,2,6,4}'),
(41623,4,'Which option?','{op.#1,op.#2,op.#3,op.#4}','{2,6,2,3}'),
(41623,3,'Pick one:','{op.1,op.2,op.3,op.4}','{2,7,1,3}'),
(41623,2,'Which animal is superior?','{pig,crocodile,duck,lion}','{2,4,3,4}'),
(41626,1,'What color is better?','{yellow,purple,blue,grey}','{1,4,4,1}')
;



CREATE TABLE ms_checkbox_questions (
    survey_id integer,
    question_id integer,
    question text NOT NULL,
    choices text[],
    res integer[],
    PRIMARY KEY (survey_id,question_id)
);

INSERT INTO ms_checkbox_questions (survey_id, question_id, question,choices, res )
VALUES(41622,1,'Which options apply?','{op.1,op.2,op.3,op.4}','{1,1,1,1}'),
(41622,2,'Which numbers are even?','{#0,#7,#24,#12}','{1,2,3,4}'),
(41623,1,'Which icecream scoops would you like?','{vanilla,chocolate,cookie dough,mint chip}','{3,5,5,4}'),
(41626,2,'Which options are reasonable?','{op.#1,op.#2,op.#3,op.#4}','{2,4,4,1}'),
(41624,2,'Pick any you like:','{op.1,op.2,op.3,op.4}','{7,7,1,6}'),
(41627,1,'Which animals have wings?','{pig,crocodile,duck,lion}','{2,0,8,1}'),
(41628,1,'What colors are primary?','{yellow,purple,blue,grey}','{6,2,6,0}')
;