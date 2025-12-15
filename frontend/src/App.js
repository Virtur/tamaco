import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import AuthProvider from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
// import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/App.css';
import { TagProvider } from './context/TagContext';
import { ContestProvider } from './context/ContestContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <AuthProvider>
        <TaskProvider>
          <TagProvider>
            <ContestProvider>
            <Layout>
            <Container className="main">
              <Routes>
                {/* Публичные маршруты */}
                <Route path="/" element={<Navigate to="/tasks" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/tasks/:id" element={<TaskDetailPage />} />
                
                {/* Защищенные маршруты */}
                {/* <Route path="/admin/*" element={<AdminPage />} /> */}
                
                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Container>
            </Layout>
            </ContestProvider>
          </TagProvider>
        </TaskProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;


// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;


