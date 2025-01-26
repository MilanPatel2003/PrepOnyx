import '@/index.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import PublicLayout from '@/layouts/PublicLayout'
import Home from '@/pages/Home'
import AuthLayout from '@/layouts/AuthLayout'
import SignInPage from '@/pages/SignInPage'
import SignUpPage from '@/pages/SignUpPage'

const App = () => {
  return (
   <Router>
    <Routes>
      {/* public routes */}
      <Route element={<PublicLayout />}>
      <Route index element={<Home/>} />
      </Route>

      {/* auth routes */}
      <Route element={<AuthLayout />}>
      <Route path='/signin/*' element={<SignInPage/>}></Route>
      <Route path='/signup/*' element={<SignUpPage/>}></Route>

      </Route>
      {/* private routes */}
    </Routes>
   </Router>
  )
}

export default App