/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const recipes = require('./recipes');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const http = require('http');
const request = require('request');
const cheerio = require('cheerio');
let token = "";
let cookieString = '';
let loginName = '';
const mailMap = new Map();
mailMap['retti'] = 'drettensteiner@gmail.com';
mailMap['rene'] = 'rettidomi@gmail.com';

const passMap = new Map();
passMap['retti'] = 'test123';
passMap['rene'] = 'test123';


/* INTENT HANDLERS */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    const item = requestAttributes.t(getRandomItem(Object.keys(recipes.RECIPE_EN_US)));

    let speakOutput = requestAttributes.t('WELCOME_MESSAGE', requestAttributes.t('SKILL_NAME'), item);
    const repromptOutput = requestAttributes.t('WELCOME_REPROMPT');
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(repromptOutput)
          .getResponse();
  },
};

const LogoutHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'LogoutIntent';
  },
  async handle(handlerInput){
    if(loginName === ''){
      return handlerInput.responseBuilder
      .speak('Benutzer ist nicht angemeldet.')
      .getResponse();
    } else {
      await logout();
      return handlerInput.responseBuilder
      .speak('Benutzer wurde abgemeldet.')
      .getResponse();
    }
  }
}

const LoginHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'LoginIntent';
  },
  async handle(handlerInput){
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if(loginName !== ''){
      await logout();
    }
    let name = handlerInput.requestEnvelope.request.intent.slots.Name.value;
    await getToken();
    if(mailMap[name] === undefined){
      return handlerInput.responseBuilder
      .speak('Benutzer ist nicht bekannt.')
      .getResponse();
    }
    await login(name);
    
    sessionAttributes.speakOutput = name + " wurde eingeloggt.";
    
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .getResponse();
  }
}

const DistanceHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'DistanceIntent';
  },
  async handle(handlerInput){
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //await getToken();
    //let name = handlerInput.requestEnvelope.request.intent.slots.Name.value;
    // if(mailMap[loginName] === undefined){
    //   return handlerInput.responseBuilder
    //   .speak('Benutzer ist nicht bekannt.')
    //   .getResponse();
    // }
    //await login(handlerInput.requestEnvelope.request.intent.slots.Name.value);
    if(loginName === ''){
      return handlerInput.responseBuilder
      .speak('Bitte bei Niederösterreich Radel anmelden.')
      .getResponse();
    }
    let body = await home();
    const $ = cheerio.load(body);
    sessionAttributes.speakOutput = $('#km').children()[0].children[0].data;
    //await logout();
    
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .getResponse();
  }
}

const AddDistanceHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddDistanceIntent';
  },
  async handle(handlerInput){
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if(loginName === ''){
      return handlerInput.responseBuilder
      .speak('Bitte anmelden.')
      .getResponse();
    }
    let dist = handlerInput.requestEnvelope.request.intent.slots.Distance.value;
    // await getToken();
    // await login(handlerInput.requestEnvelope.request.intent.slots.Name.value);
    let body = await home();
    const $ = cheerio.load(body);
    let bikeID = $('#nav-tab').children()[0].attribs['data-bikeid'];
    sessionAttributes.speakOutput = dist + " Kilometer hinzugefügt.";
    await postDistance(dist, bikeID, new Date());
    // await logout();
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .getResponse();
  }
}


// const RecipeHandler = {
//   canHandle(handlerInput) {
//     return handlerInput.requestEnvelope.request.type === 'IntentRequest'
//       && handlerInput.requestEnvelope.request.intent.name === 'RecipeIntent';
//   },
//   async handle(handlerInput) {
//     const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
//     const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

//     const itemSlot = handlerInput.requestEnvelope.request.intent.slots.Item;
//     let itemName;
//     if (itemSlot && itemSlot.value) {
//       itemName = itemSlot.value.toLowerCase();
//     }

//     const cardTitle = requestAttributes.t('DISPLAY_CARD_TITLE', requestAttributes.t('SKILL_NAME'), itemName);
//     const myRecipes = requestAttributes.t('RECIPES');
//     const recipe = myRecipes[itemName];
//     let speakOutput = '';
    
//     const repromptSpeech = requestAttributes.t('RECIPE_NOT_FOUND_REPROMPT');
//     if (itemName) {
//       speakOutput += requestAttributes.t('RECIPE_NOT_FOUND_WITH_ITEM_NAME', itemName);
//     } else {
//       speakOutput += requestAttributes.t('RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME');
//     }
//     speakOutput += repromptSpeech;

//     // save outputs to attributes, so we can use it to repeat
//     sessionAttributes.speakOutput = speakOutput;
//     sessionAttributes.repromptSpeech = repromptSpeech;

//     handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

//     return handlerInput.responseBuilder
//       .speak(sessionAttributes.speakOutput)
//       .reprompt(sessionAttributes.repromptSpeech)
//       .getResponse();
//   },
// };

// const HelpHandler = {
//   canHandle(handlerInput) {
//     return handlerInput.requestEnvelope.request.type === 'IntentRequest'
//       && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
//   },
//   handle(handlerInput) {
//     const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
//     const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

//     const item = requestAttributes.t(getRandomItem(Object.keys(recipes.RECIPE_EN_US)));

//     sessionAttributes.speakOutput = requestAttributes.t('HELP_MESSAGE', item);
//     sessionAttributes.repromptSpeech = requestAttributes.t('HELP_REPROMPT', item);

//     return handlerInput.responseBuilder
//       .speak(sessionAttributes.speakOutput)
//       .reprompt(sessionAttributes.repromptSpeech)
//       .getResponse();
//   },
// };

const RepeatHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .reprompt(sessionAttributes.repromptSpeech)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = requestAttributes.t('STOP_MESSAGE', requestAttributes.t('SKILL_NAME'));

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log('Inside SessionEndedRequestHandler');
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

/* Helper Functions */

// Finding the locale of the user
const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageStrings,
      returnObjects: true,
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    };
  },
};

// getRandomItem
function getRandomItem(arrayOfItems) {
  // the argument is an array [] of words or phrases
  let i = 0;
  i = Math.floor(Math.random() * arrayOfItems.length);
  return (arrayOfItems[i]);
}



//niederösterreich radelt
function getToken(){
  return new Promise((resolve, reject) => {
    request.get({
      uri: "https://niederoesterreich.radelt.at/dashboard/login"
      },(err,resp,body)=>{
        renewTokenAndCookies(resp, body);
        resolve();
    })
  })
}

function renewTokenAndCookies(resp, body){
  // get token
  const $ = cheerio.load(body);
  for (index = 0; index < $('head').children().length; ++index) {
    var element = $('head').children()[index];
    if (element.attribs.name == 'csrf-token'){
      token = element.attribs.content;
    }
  }

  // get cookies 
  cookieString = '';
  resp.headers['set-cookie'].forEach(cookie => {
    cookieString = cookieString + cookie.split(';')[0] + ';';
  });
}

function login(name){
  return new Promise((resolve, reject) => {    
    request.post({
      url:     'https://niederoesterreich.radelt.at/dashboard/login',
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Cookie': cookieString 
        },
      formData: {
        '_token': token,
        'email': mailMap[name],
        'password': passMap[name]
      }
    }, function(error, resp, body){
      renewTokenAndCookies(resp, body);
      loginName = name;
      resolve();
    });
  })
}

function home(){
  return new Promise((resolve, reject) => {
    request.get({
      uri: "https://niederoesterreich.radelt.at/dashboard/home",
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Cookie': cookieString 
        },
      },(err,resp,body)=>{
        renewTokenAndCookies(resp, body);
        resolve(body);
    })
  })
}

function logout(){
  return new Promise((resolve, reject) => {
    request.post({
      uri: "https://niederoesterreich.radelt.at/dashboard/logout",
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Cookie': cookieString 
        },
      formData: {
        '_token': token
        }
      },(err,resp,body)=>{
        renewTokenAndCookies(resp, body);
        loginName = '';
        resolve();
    })
  })
}

function postDistance(distance, bikeID, date){
  return new Promise((resolve, reject) => {    
    request.post({
      url: 'https://niederoesterreich.radelt.at/dashboard/rides/store/distance',
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Cookie': cookieString 
        },
      formData: {
        '_token': token,
        'km_cache': distance,
        'description': 'Inserted with Alexa skill.',
        'userdate': '20.06.2020',
        'datetime': '2020-06-06',
        'bike_id': bikeID
      }
    }, function(error, resp, body){
      renewTokenAndCookies(resp, body);
      resolve();
    });
  })
}

/* LAMBDA SETUP */
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    RepeatHandler,
    ExitHandler,
    SessionEndedRequestHandler,
    DistanceHandler,
    AddDistanceHandler,
    LoginHandler,
    LogoutHandler,
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();

// langauge strings for localization
// TODO: The items below this comment need your attention

const languageStrings = {
  'en': {
    translation: {
      RECIPES: recipes.RECIPE_EN_US,
      SKILL_NAME: 'Minecraft Helper',
      WELCOME_MESSAGE: 'Welcome to %s. You can ask a question like, what\'s the recipe for a %s? ... Now, what can I help you with?',
      WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
      DISPLAY_CARD_TITLE: '%s  - Recipe for %s.',
      HELP_MESSAGE: 'You can ask questions such as, what\'s the recipe for a %s, or, you can say exit...Now, what can I help you with?',
      HELP_REPROMPT: 'You can say things like, what\'s the recipe for a %s, or you can say exit...Now, what can I help you with?',
      STOP_MESSAGE: 'Goodbye!',
      RECIPE_REPEAT_MESSAGE: 'Try saying repeat.',
      RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'I\'m sorry, I currently do not know the recipe for %s. ',
      RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'I\'m sorry, I currently do not know that recipe. ',
      RECIPE_NOT_FOUND_REPROMPT: 'What else can I help with?',
    },
  },
  'en-US': {
    translation: {
      RECIPES: recipes.RECIPE_EN_US,
      SKILL_NAME: 'American Minecraft Helper',
    },
  },
  'en-GB': {
    translation: {
      RECIPES: recipes.RECIPE_EN_GB,
      SKILL_NAME: 'British Minecraft Helper',
    },
  },
  'de': {
    translation: {
      RECIPES: recipes.RECIPE_DE_DE,
      SKILL_NAME: 'Assistent für Minecraft',
      WELCOME_MESSAGE: 'Willkommen bei %s. Du kannst beispielsweise die Frage stellen:  was ist eine Feuerwerksrakete? ... Nun, womit kann ich dir helfen?',
      WELCOME_REPROMPT: 'Wenn du wissen möchtest, was du sagen kannst, sag einfach „Hilf mir“.',
      DISPLAY_CARD_TITLE: '%s - Rezept für %s.',
      HELP_MESSAGE: 'Du kannst beispielsweise Fragen stellen wie „Wie geht das Rezept für eine %s“ oder du kannst „Beenden“ sagen ... Wie kann ich dir helfen?',
      HELP_REPROMPT: 'Du kannst beispielsweise Sachen sagen wie „Wie geht das Rezept für eine %s“ oder du kannst „Beenden“ sagen ... Wie kann ich dir helfen?',
      STOP_MESSAGE: 'Auf Wiedersehen!',
      RECIPE_REPEAT_MESSAGE: 'Sage einfach „Wiederholen“.',
      RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'Tut mir leid, ich kenne derzeit das Rezept für %s nicht. ',
      RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'Tut mir leid, ich kenne derzeit dieses Rezept nicht. ',
      RECIPE_NOT_FOUND_REPROMPT: 'Womit kann ich dir sonst helfen?',
    },
  },
};
