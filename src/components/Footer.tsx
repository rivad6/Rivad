import { ArrowUpRight, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PricingText } from './PricingText';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-transparent text-gray-300 border-t border-brand-accent/20 relative overflow-hidden">
      
      {/* Immersive background blur */}
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 relative z-10">
        
        <div className="mb-24" id="contacto">
          <h2 className="text-sm font-mono tracking-[0.4em] text-brand-accent/60 uppercase mb-8 border-b border-brand-accent/20 pb-4 inline-block w-full md:w-auto transition-all duration-500">
            04 // {t('footer.links.comms')}
          </h2>
          <h3 className="text-[12vw] md:text-[9vw] font-display uppercase tracking-[-0.04em] leading-[0.8] w-full text-balance text-white text-center transition-all duration-700">
            {t('footer.title.main')}<br/>
            <span className="opacity-80">
              {t('footer.title.sub').split('{{highlight}}')[0]}
              <span className="font-display font-medium tracking-normal text-brand-accent lowercase relative inline-block">
                {t('footer.title.highlight')}
                <span className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-px md:h-1 bg-brand-accent/50 blur-[2px]"></span>
              </span>
              {t('footer.title.sub').split('{{highlight}}')[1]}
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 md:gap-32">
          {/* Left Column - Contact Details */}
          <div className="flex flex-col justify-start">
            <p className="text-gray-400/50 font-sans font-light text-lg md:text-xl mb-16 max-w-lg leading-relaxed text-balance transition-colors duration-500">
              {t('footer.subtitle')}
            </p>
            
            <a 
              href="mailto:oscarcesar0606@gmail.com" 
              className="group inline-flex items-center justify-between w-full md:w-max px-8 py-6 border border-white/5 hover:border-brand-accent hover:bg-brand-accent hover:text-white transition-all duration-700 font-mono text-xl md:text-2xl mb-24 text-gray-100 frosted-layer"
            >
              <span>oscarcesar0606@gmail.com</span>
              <ArrowUpRight size={24} className="ml-8 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </a>
            
            <div className="flex flex-col sm:flex-row gap-16 md:gap-24">
              <div>
                <h3 className="text-[10px] font-mono tracking-[0.3em] text-gray-600 uppercase mb-8 font-bold border-l-2 border-brand-accent/30 pl-4">{t('footer.links.comms')}</h3>
                <ul className="flex flex-col space-y-6">
                  <li className="flex flex-col text-gray-400 font-light group">
                    <span className="text-[9px] font-mono uppercase text-gray-700 mb-2 transition-colors duration-300 group-hover:text-brand-accent">{t('footer.comms')}</span>
                    <a href="https://wa.me/522223882341" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors font-mono text-xl text-gray-200">+52 222 388 2341</a>
                  </li>
                  <li className="flex flex-col text-gray-400 font-light group">
                    <span className="text-[9px] font-mono uppercase text-gray-700 mb-2 transition-colors duration-300 group-hover:text-brand-accent">{t('footer.base')}</span>
                    <span className="font-sans text-xl text-gray-200">{t('footer.location')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-[10px] font-mono tracking-[0.3em] text-gray-600 uppercase mb-8 font-bold border-l-2 border-brand-accent/30 pl-4">{t('footer.links.net')}</h3>
                <ul className="flex flex-col gap-4">
                  {[
                    { name: 'Instagram', url: 'https://www.instagram.com/oscar.c.rivadeneyra/' }
                  ].map((social) => (
                    <li key={social.name}>
                      <a 
                        href={social.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-mono text-gray-500 hover:text-brand-accent flex items-center gap-2 group transition-all duration-300"
                      >
                        {social.name}
                        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-x-0.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Direct Form */}
          <div className="relative p-8 md:p-12 border border-white/5 bg-transparent frosted-layer group overflow-hidden rounded-3xl transition-all duration-700 hover:border-brand-accent/40">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <h3 className="text-2xl font-display font-light mb-12 pb-6 border-b border-white/5 flex justify-between items-center text-brand-accent">
              <span className="font-serif italic">{t('footer.direct')}</span>
              <span className="font-mono text-[9px] text-brand-accent border border-brand-accent/30 bg-brand-accent/5 px-3 py-1.5 uppercase tracking-[0.3em] rounded-full">{t('footer.online')}</span>
            </h3>
            
            <form className="space-y-10" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              const subject = `${t('footer.form.subject')} - ${data.name}`;
              const body = `${t('footer.form.body.name')}: ${data.name}\n${t('footer.form.body.email')}: ${data.email}\n${t('footer.form.body.topic')}: ${data.topic}\n${t('footer.form.body.msg')}: ${data.message}`;
              window.location.href = `mailto:oscarcesar0606@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label htmlFor="name" className="text-[9px] font-mono tracking-[0.4em] text-gray-600 uppercase block">{t('footer.form.name.label')}</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    required
                    className="w-full bg-transparent border-b border-white/10 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors duration-300 px-1 font-sans text-lg placeholder:text-gray-800"
                    placeholder={t('footer.form.name.ph')}
                  />
                </div>
                <div className="space-y-3">
                  <label htmlFor="email" className="text-[9px] font-mono tracking-[0.4em] text-gray-600 uppercase block">{t('footer.form.email.label')}</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    required
                    className="w-full bg-transparent border-b border-white/10 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors duration-300 px-1 font-sans text-lg placeholder:text-gray-800"
                    placeholder={t('footer.form.email.ph')}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label htmlFor="topic" className="text-[9px] font-mono tracking-[0.4em] text-gray-600 uppercase block">{t('footer.form.topic.label')}</label>
                <div className="relative">
                  <select id="topic" name="topic" required className="w-full bg-transparent border-b border-white/10 py-4 text-gray-500 focus:outline-none focus:border-brand-accent transition-colors duration-300 px-1 appearance-none font-sans text-lg cursor-pointer hover:text-white">
                    <option value="" className="text-gray-500 bg-transparent">{t('footer.form.topic.opt1')}</option>
                    <option value="Servicios Web" className="text-gray-100 bg-[#111]">{t('footer.form.topic.opt2')}</option>
                    <option value="Juegos Web" className="text-gray-100 bg-[#111]">{t('footer.form.topic.opt3')}</option>
                    <option value="Gestión Cultural y Conferencias" className="text-gray-100 bg-[#111]">{t('footer.form.topic.opt4')}</option>
                    <option value="Colaboración Musical" className="text-gray-100 bg-[#111]">{t('footer.form.topic.opt5')}</option>
                    <option value="Otros asuntos" className="text-gray-100 bg-[#111]">{t('footer.form.topic.opt6')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="message" className="text-[9px] font-mono tracking-[0.4em] text-gray-600 uppercase block">{t('footer.form.msg.label')}</label>
                <textarea 
                  id="message" 
                  name="message"
                  required
                  rows={4}
                  className="w-full bg-transparent border-b border-white/10 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors duration-300 px-1 resize-none font-sans text-lg placeholder:text-gray-800 leading-relaxed"
                  placeholder={t('footer.form.msg.ph')}
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full mt-12 frosted-layer border border-brand-accent/30 text-brand-accent hover:border-brand-accent hover:bg-brand-accent hover:text-white transition-all duration-700 py-6 font-mono font-bold uppercase tracking-[0.4em] text-[10px] justify-center items-center gap-4 group flex rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
              >
                {t('footer.send')}
                <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-40 pt-10 border-t border-brand-accent/20 flex flex-col items-center gap-8 text-[9px] font-mono text-gray-600 uppercase tracking-[0.4em] text-center w-full">
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-8">
            <p>© {new Date().getFullYear()} By Rivad. {t('footer.rights')}</p>
            <div className="flex items-center gap-6">
              <span className="w-1.5 h-1.5 bg-brand-accent/60 rounded-full animate-pulse shadow-[0_0_5px_rgba(220,38,38,0.5)]"></span>
              <p className="hover:text-brand-accent transition-colors cursor-default">{t('footer.made')}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-brand-accent/10 w-full flex flex-col justify-center gap-2 text-gray-700">
            <p>Digital Footprint / Huella Digital: <span className="text-brand-accent/50">SHA256:0x39A8B2C4F9E7D1...[RIVAD_AUTH_APP]</span></p>
            <p className="text-[8px] text-gray-800 opacity-60 max-w-2xl mx-auto tracking-widest leading-loose">
              <PricingText />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
