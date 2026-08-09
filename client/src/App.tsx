import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import NewCourse from './pages/NewCourse';
import CourseView from './pages/CourseView';
import Setup from './pages/Setup';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewCourse />} />
        <Route path="/courses/:id" element={<CourseView />} />
        <Route path="/setup" element={<Setup />} />
      </Routes>
    </Layout>
  );
}
