var answerId = 1; //<!-- used by other functions to keep track of IDs/# of answers added -->

// data that gets passed to server via submitData()
var questionObj = {
  type: "",
  question: "",
  choices: []
};

var dataObj = {
  name: "",
  description: "",
  questions: []
};

// called when user clicks add question button
function resetAnswerId() {
  answerId = 1;
}

function viewAnswerBuilder(id) {
  if(id.value == "radio" || id.value == "checkbox") { // Multiple chioce or checkbox is selected
    document.getElementById("MCAnswers").style.display = "block";
    document.getElementById("AddAnswerButton").style.display = "block";
  } else if(id.value == "tf") {
    answerId = 2;
  }
}

function hideModal() {
  $('#newQuestionModal').modal('hide');
}

function showModal() {
  $('#newQuestionModal').modal('show');
}

function submitData() {
  $.post("/create/submit",dataObj, data=>{
    location.assign(data.redirectURL)
  })
}

// for debugging purposes
function printDataObj() {
  console.log("name: " + dataObj.name);
  console.log("description: " + dataObj.description);

  var numQuestions = dataObj.questions.length;
  console.log("numQuestions: " + numQuestions);

  for(var i = 0; i < numQuestions; i++) { // iterate over questions for a submission
    console.log("question " + i + " type: " + dataObj.questions[i].type);
    console.log("question " + i + " question: " + dataObj.questions[i].question);
    for(var j = 0; j < dataObj.questions[i].choices.length; j++) { // iterate over choices for a question
      console.log("answer " + j + " for question " + i + " : " + dataObj.questions[i].choices[j]);
    }
  }
}

// adds question data to variables from card when new question is submitted
function fillQuestionData() {
  var newQuestion = {type: "", question: "", choices: []}; // new instance of question object
  newQuestion.question = document.getElementById("questionTitle").value;
  newQuestion.type = document.getElementById("questionTypeSelect").value;

  var counter = 1;
  var answerFormId = "answer" + counter;
  if(newQuestion.type != "tf") {
    for(counter; counter <= answerId;) {
      // add value to choices array
      newQuestion.choices.push(document.getElementById(answerFormId).value);
      counter++;
      answerFormId = "answer" + counter;
    }
  }
  else {
    newQuestion.choices.push("True");
    newQuestion.choices.push("False");
  }

  dataObj.questions.push(newQuestion);
}

// adds survey title and description to data object variable
function fillHeaderData() {
  dataObj.name = document.getElementById("surveyTitle").value;
  dataObj.description = document.getElementById("surveyDescription").value;
}

// make sure user has filled out new question form before adding card
function validateForm() {
  var questionName = document.getElementById("questionTitle");
  var questionType = document.getElementById("questionTypeSelect");
  var submitQuestionButton = document.getElementById("submitQuestionButton");
  var questionModal = document.getElementById("newQuestionModal");
  if(questionName.value == "" || questionType.value == "default") {
    alert("Please complete the form");
  } else { // call add card function and clear modal if form is valid
    hideModal();
    fillQuestionData();
    addQuestionCard();
    clearModal();
  }
}

// clears the modal and resets necessary variables when the modal gets cleared
// so that more than one question can be added without trouble
function clearModal() {
  // remove answer forms in modal until only the hard-coded one remains
  for(var numAnswer = answerId; numAnswer > 1; numAnswer--) {
    if(document.getElementById("questionTypeSelect").value != "tf") { // nothing to delete if question type is true/false
      var answerFormId = "answer" + numAnswer;
      removeElement(answerFormId);
    }
  }

  document.getElementById("MCAnswers").style.display = "none";
  document.getElementById("AddAnswerButton").style.display = "none";
  document.getElementById("questionTitle").value = "";
  document.getElementById("questionTypeSelect").value = "default";
  document.getElementById("answer1").value = ""; // reset value of first answer form
  answerId = 1;
}

function addElement(parentId, elementTag, elementId) {
  // Adds an element to the document
  var parent = document.getElementById(parentId);
  var newAns = document.createElement(elementTag);
  newAns.setAttribute('id', elementId);
  newAns.setAttribute('class', 'form-control');
  newAns.setAttribute('type', 'text');
  newAns.setAttribute('placeholder', 'Enter your answer here...');
  newAns.style.marginTop = "2%";
  parent.appendChild(newAns);
}

function removeElement(elementId) {
  // Removes an element from the document
  var element = document.getElementById(elementId);
  element.parentNode.removeChild(element);
}

function addAnswer() {
    answerId++; // increment fileId to get a unique ID for the new element
    addElement('MCAnswers', 'input', 'answer' + answerId);
}

function addQuestionCardHelper(parentId, elementTag) {
  var parent = document.getElementById(parentId);
  var newCard = document.createElement(elementTag);
  newCard.setAttribute('class', 'card');
  newCard.style.marginTop = "2%";

  // create card header and append to new card
  var cardHeader = document.createElement('div');
  cardHeader.setAttribute('class', 'card-header');
  cardHeader.innerHTML = questionTitle.value;
  newCard.appendChild(cardHeader);

  // create card body and append to new card
  var cardBody = document.createElement('div'); // card body displays answer options
  cardBody.setAttribute('class', 'card-body');
  newCard.appendChild(cardBody);

  for(var numAnswer = 1; numAnswer <= answerId; numAnswer++) {
    // loop to create divs which holds answers
    var questionContainer = document.createElement('div');
    questionContainer.setAttribute('class', 'form-check');
    cardBody.appendChild(questionContainer);

    // elements which get appended to form check div
    var inputBox = document.createElement('input'); // checkbox (doesn't do anything)
    inputBox.setAttribute('id', numAnswer);
    inputBox.setAttribute('class', 'form-check-input');
    var questionLabel = document.createElement('label'); // question text
    questionLabel.setAttribute('for', numAnswer);
    questionLabel.setAttribute('class', 'form-check-label');
    var answerFormId = "answer" + numAnswer;

    if(questionTypeSelect.value == "checkbox") { // question type is checkbox
      inputBox.setAttribute('type', 'checkbox');
      questionContainer.appendChild(inputBox);
      questionLabel.innerHTML = document.getElementById(answerFormId).value;
    }
    else if(questionTypeSelect.value == "radio") { // question type is multiple choice
      inputBox.setAttribute('type', 'radio');
      questionContainer.appendChild(inputBox);
      questionLabel.innerHTML = document.getElementById(answerFormId).value;
    }
    else if(questionTypeSelect.value == "tf") { // question type is true/false
      inputBox.setAttribute('type', 'radio');
      questionContainer.appendChild(inputBox);
      if(numAnswer == 1) questionLabel.innerHTML = "True"; // kind of a bodge but oh well
        else questionLabel.innerHTML = "False";
    } else {}
    questionContainer.appendChild(questionLabel);
  }
  parent.appendChild(newCard);
}

function addQuestionCard() {
  addQuestionCardHelper('cards', 'div');
}
