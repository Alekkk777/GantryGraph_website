import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/landing/Hero';
import Pillars from '@/components/landing/Pillars';
import Architecture from '@/components/landing/Architecture';
import UseCases from '@/components/landing/UseCases';
import Comparison from '@/components/landing/Comparison';
import FAQ from '@/components/landing/FAQ';
import FinalCTA from '@/components/landing/FinalCTA';

export default function HomePage() {
  return (
    <>
      <Header variant="landing" />
      <main>
        <Hero />
        <Pillars />
        <Architecture />
        <UseCases />
        <Comparison />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
