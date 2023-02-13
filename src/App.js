import './App.css';
import {useEffect, useState} from 'react'
import Main from './components/Main';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./components/Login"
import { getFirestore, doc, getDoc } from "firebase/firestore";
// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyDazkUMxMUnWRpp19dAH31_TXJ3xrQL3RE",
  authDomain: "attain-23279.firebaseapp.com",
  projectId: "attain-23279",
  storageBucket: "attain-23279.appspot.com",
  messagingSenderId: "556882473265",
  appId: "1:556882473265:web:a92cd9a5294dc755f38010",
  measurementId: "G-H6QGK63XJL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const db = getFirestore(app);






const client = new ApolloClient({
  uri: 'https://attain-server.herokuapp.com',
  cache: new InMemoryCache(),
});

function App() {
  const [userId, setUserId] = useState(null)
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const querySnapshot = await getDoc(doc(db, "users", user.uid));
      // await Amplitude.initializeAsync("3b0e62f88e06cf0de6e5009d92924990");
      // await Amplitude.setUserIdAsync(querySnapshot.data()["userId"]);
      // await Amplitude.logEventAsync("USER_OPENED_APP");
      setUserId(querySnapshot.data()["userId"]);
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      const uid = user.uid;
      setIsLoggedIn(true)
      // ...
    } else {
      // User is signed out
      // ...
      setIsLoggedIn(false)
    }
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  return (
    <ApolloProvider client={client}>
     {isLoggedIn ? <Main userId={userId}/> : <Login/>}
    
    </ApolloProvider>
  );
}

export default App;
