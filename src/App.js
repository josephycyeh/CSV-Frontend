import './App.css';
import Main from './components/Main';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';


const client = new ApolloClient({
  uri: 'https://attain-server.herokuapp.com',
  
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
    <Main></Main>
    </ApolloProvider>
  );
}

export default App;
