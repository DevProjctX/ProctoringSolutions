//Service Worker Catch Any Errors...
try{

    //Import Firebase Local Scripts
    self.window = self
    self.importScripts(
      'firebase/firebase-app.js',
      'firebase/firebase-auth.js',
      'firebase/firebase-database.js'
    );
  
    // Your web app's Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyCFqdrDM-UZh8mOj12_AbdYu8qvzJE9Z5M",
        authDomain: "personal-test-81fe1.firebaseapp.com",
        projectId: "personal-test-81fe1",
        storageBucket: "personal-test-81fe1.appspot.com",
        messagingSenderId: "175534480516",
        appId: "1:175534480516:web:9cf8b0971d6ff0cfc6f6d1",
        measurementId: "G-BZQJ4NKXGQ"
      };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log(firebase)
    var db = firebase.database();
    //Add Auth to storage
    var user = firebase.auth().currentUser;
    console.log(user);
    if (user) {
      //user is signed in
      chrome.storage.local.set({ authInfo: user });
    } else {
      //user is not signed in
      chrome.storage.local.set({ authInfo: false });
    }
  
    /*
    Response Calls
      resp({type: "result", status: "success", data: doc.data(), request: msg});
      resp({type: "result", status: "error", data: error, request: msg});
    */
    chrome.runtime.onMessage.addListener((msg, sender, resp) => {
  
      if(msg.command == "user-auth"){
        firebase.auth().onAuthStateChanged(function(user) {
          if (user) {
            // User is signed in.
            chrome.storage.local.set({ authInfo: user });
            firebase.database().ref("/users/" + user.uid).once("value").then(function (snapshot) {
              console.log(snapshot.val());
              resp({type: "result", status: "success", data: user, userObj: snapshot.val()});
            }).catch((result) => {
              chrome.storage.local.set({ authInfo: false });
              resp({type: "result", status: "error", data: false});
            });
          } else {
            // No user is signed in.
            chrome.storage.local.set({ authInfo: false });
            resp({type: "result", status: "error", data: false});
          }
        });
      }
  
      //Auth
      //logout
      if(msg.command == "auth-logout"){
        firebase.auth().signOut().then(function () {
          //user logged out...
          chrome.storage.local.set({ authInfo: false });
          resp({type: "result", status: "success", data: false});
        },function (error) {
          //logout error....
          resp({type: "result", status: "error", data: false,message: error});
        });
      }
      //Login
      if(msg.command == "auth-login"){
        //login user
        firebase.auth().signInWithEmailAndPassword(msg.e, msg.p).catch(function (error) {
          if (error) {
            //return error msg...
            chrome.storage.local.set({ authInfo: false });
            resp({type: "result", status: "error", data: false});
          }
        });
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            //return success user objct...
            chrome.storage.local.set({ authInfo: user });
            firebase.database().ref("/users/" + user.uid).once("value").then(function (snapshot) {
              resp({type: "result", status: "success", data: user, userObj: snapshot.val()});
            }).catch((result) => {
              chrome.storage.local.set({ authInfo: false });
              resp({type: "result", status: "error", data: false});
            });
          }
        });
      }
      //Sign Up
      if(msg.command == "auth-signup"){
        //create user
        ///get user id
        //make call to lambda
        chrome.storage.local.set({ authInfo: false });
        firebase.auth().signOut();
        firebase.auth().createUserWithEmailAndPassword(msg.e, msg.p).catch(function (error) {
          // Handle Errors here.
          chrome.storage.local.set({ authInfo: false }); // clear any current session
          var errorCode = error.code;
          var errorMessage = error.message;
          resp({type: "signup", status: "error", data: false, message: error});
        });
        //complete payment and create user object into database with new uid
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) { //user created and logged in ...
            //build url...
            var urlAWS = 'https://ENTER-YOUR-LAMBA-URL-HERE?stripe=true';
            urlAWS+='&uid='+user.uid;
            urlAWS+='&email='+msg.e;
            urlAWS+='&token='+msg.tokenId;
  
            chrome.storage.local.set({ authInfo: user });
            //console.log('make call to lambda:', urlAWS);
            try //catch any errors
            {
              fetch(urlAWS).then((response) => {
                return response.json(); //convert to json for response...
              }).then((res) => {
                //update and create user obj
                firebase.database().ref("/users/" + user.uid).set({stripeId: res});
                //success / update user / and return
                firebase.database().ref("/users/" + user.uid).once("value").then(function (snapshot) {
                  resp({type: "result", status: "success", data: user, userObj: snapshot.val()});
                }).catch((result) => {
                  chrome.storage.local.set({ authInfo: false });
                  resp({type: "result", status: "error", data: false});
                });
              }).catch((error) => {
                console.log(error, "error with payment?");
                chrome.storage.local.set({ authInfo: false });
                resp({type: "result", status: "error", data: false});
              });
            } catch (e) {
              console.log(error, "error with payment?");
              chrome.storage.local.set({ authInfo: false });
              resp({type: "result", status: "error", data: false});
            }
          }
        });
      }
      return true;
    });
  
  }catch(e){
    //error
    console.log(e);
  }
  