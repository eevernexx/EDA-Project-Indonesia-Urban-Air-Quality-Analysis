import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Overview from "./pages/Overview.jsx";
import Temporal from "./pages/Temporal.jsx";
import Weather from "./pages/Weather.jsx";
import Covid from "./pages/Covid.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="temporal" element={<Temporal />} />
        <Route path="weather" element={<Weather />} />
        <Route path="covid" element={<Covid />} />
      </Route>
    </Routes>
  );
}
