import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { Projects } from "@/components/projects";
import { Process } from "@/components/process";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { JsonLd } from "@/components/json-ld";
import { getProjects } from "@/lib/api";

export default async function Home() {
  const projects = await getProjects();

  return (
    <>
      <JsonLd />
      <main className="min-h-screen">
        <Header />
        <Hero />
        <Services />
        <Projects projects={projects} />
        <Process />
        <Contact />
        <Footer />
        <ScrollToTop />
      </main>
    </>
  );
}
