import { useEffect, useState } from "react";
import { Card } from "./components/ui/card";

function App() {
  const [authStatus, setAuthStatus] = useState("");

  useEffect(() => {
    fetch("http://localhost:3006/health")
      .then((res) => res.json())
      .then((data) => setAuthStatus(data.status));
  }, []);

  return <Card>Auth Service:{authStatus}</Card>;
}

export default App;
