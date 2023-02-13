import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    margin: '24px 0',
  },
  form: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  textField: {
    margin: '16px 0',
    width: '100%',
  },
  submit: {
    margin: '24px 0',
  },
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const auth = getAuth()
 
    signInWithEmailAndPassword(auth, username + "@joinattain.com", password)
      .then(() => {})
      .catch((error) => {
        const errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode == "auth/too-many-requests") {
          errorMessage = "Too Many Requests, Wait A Minute To Try Again";
        }
        if (errorCode == "auth/wrong-password") {
          errorMessage = "Wrong Password";
        }

        if (errorCode == "auth/user-not-found") {
          errorMessage = "Wrong Username";
        }
        console.log(errorMessage)
        // setLoginError(errorMessage);
        // setTimeout(() => setLoginError(null), 3000);
      });
  };

  return (
    <div style={styles.root}>
      <Typography variant="h4" style={styles.title}>
        Attain CSV Login
      </Typography>
      <form style={styles.form} onSubmit={handleSubmit}>
        <TextField
          required
          id="username"
          label="Username"
          value={username}
          onChange={handleUsernameChange}
          style={styles.textField}
        />
        <TextField
          required
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          style={styles.textField}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          style={styles.submit}
        >
          Submit
        </Button>
      </form>
    </div>
  );
}
