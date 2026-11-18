import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

const App = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div>
      {isLogin ? (
        <LoginPage onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterPage onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
};

export default App;
