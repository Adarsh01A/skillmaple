import React, { useState } from 'react';
import Login from './Login';
import VideoApp from './VideoApp';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="App">
      {!isLoggedIn ? <Login onLogin={handleLogin} /> : <VideoApp />}
    </div>
  );
}

export default App;
