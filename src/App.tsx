import '@/index.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import PublicLayout from '@/layouts/PublicLayout'
import Home from '@/pages/Home'
import AuthLayout from '@/layouts/AuthLayout'
import SignInPage from '@/pages/SignInPage'
import SignUpPage from '@/pages/SignUpPage'
import ProtectRoutes from '@/layouts/ProtectedRoutes'
import { MainLayout } from '@/layouts/MainLayout'
import MockInterview from './pages/dashboard/mock-interview/MockInterview'
import InterviewForm from './pages/dashboard/mock-interview/InterviewForm'
import StartInterviewLoadPage from './pages/dashboard/mock-interview/StartInterviewLoadPage'
import StartInterview from './pages/dashboard/mock-interview/StartInterview'
import InterviewFeedback from './pages/dashboard/mock-interview/InterviewFeedback'
import PdfAnalyzer from './pages/dashboard/pdf-analyzer/PdfAnalyzer'
import Skribble from './pages/dashboard/SkribbleAI/Skribble'
import Dashboard from './pages/dashboard/Dashboard'


// Import your feature pages
// import MockInterview from '@/pages/dashboard/MockInterview'
// import PdfAnalyzer from '@/pages/dashboard/PdfAnalyzer'
// import CourseGenerator from '@/pages/dashboard/CourseGenerator'
// import Flashcards from '@/pages/dashboard/Flashcards'
// import Profile from '@/pages/dashboard/Profile'

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <Router>
        <Routes>
          {/* public routes */}
          <Route element={<PublicLayout />}>
            <Route index element={<Home/>} />
          </Route>

          {/* auth routes */}
          <Route element={<AuthLayout />}>
            <Route path='/signin/*' element={<SignInPage/>} />
            <Route path='/signup/*' element={<SignUpPage/>} />
          </Route>

          {/* protected routes */}
          <Route
            element={
              <ProtectRoutes>
                <MainLayout />
              </ProtectRoutes>
            }
          >
            <Route path="/dashboard">
            <Route index element={<Dashboard />} /> {/* New route */}

              <Route path="skribbleAI" element={<Skribble />} />

              <Route path="mock-interview">
                <Route index element={<MockInterview />} />
                <Route path="create" element={<InterviewForm />} />
                <Route path=":id" element={<InterviewForm />} />
                <Route path=":id/feedback" element={<InterviewFeedback />} />
                <Route path=":id/start" element={<StartInterview />} /> 
                <Route path=":id/loadpage" element={<StartInterviewLoadPage />} /> 
              </Route>
              <Route path="pdf-analyzer" element={<PdfAnalyzer />} />
              {/* <Route path="course-generator" element={<CourseGenerator />} />
              <Route path="flashcards" element={<Flashcards />} />
              <Route path="profile" element={<Profile />} /> */}
            </Route>
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App