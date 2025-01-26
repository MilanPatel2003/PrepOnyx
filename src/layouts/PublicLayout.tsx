import Footer from "@/components/Footer"
import Header from "@/components/Header"
import {Outlet} from 'react-router-dom'
import AuthHandler from "@/handlers/authHandler"

const PublicLayout = () => {
  return (
    <div className="w-full">
        {/* Handler to store User data */}
        <AuthHandler/>
        <Header />
        <Outlet />
        <Footer />
    </div>
  )
}

export default PublicLayout