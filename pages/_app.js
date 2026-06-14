import "../styles/tailwind.css";
import "../styles/globals.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { ToastProvider } from "../components/ToastProvider";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <ToastProvider>
      <div className="app-shell">
        <Navbar />
        <div className="app-main">
          <div key={router.asPath} className="page-transition">
            <Component {...pageProps} />
          </div>
        </div>
        <Footer />
      </div>
    </ToastProvider>
  );
}
