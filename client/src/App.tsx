import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import NewCourse from './pages/NewCourse';
import ManualCourse from './pages/ManualCourse';
import CourseView from './pages/CourseView';
import Setup from './pages/Setup';
import About from './pages/About';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewCourse />} />
        <Route path="/new/manual" element={<ManualCourse />} />
        <Route path="/courses/:id" element={<CourseView />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
}
