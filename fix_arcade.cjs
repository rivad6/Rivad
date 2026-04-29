const fs = require('fs');
let code = fs.readFileSync('src/components/Arcade.tsx', 'utf8');

// 1. Fullscreen Cartridge Selector instead of native select
const selectRegex = /\{\/\* Fullscreen Button \*\/\}/;
code = code.replace(/\{isFullscreen && \([\s\S]*?<\/select>\n\s*\)\}/m, `
              {isFullscreen && (
                <div className="relative group">
                  <button className="bg-[#1e1b4b] text-[#818cf8] border-2 border-[#4f46e5] font-mono text-[10px] md:text-xs rounded-md px-4 py-2 uppercase tracking-widest hover:bg-[#312e81] shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                    {activeGame ? games.find(g => g.id === activeGame)?.title : 'SELECT CARTRIDGE'}
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#020617] border border-[#312e81] rounded-lg p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     <p className="text-[#818cf8] text-[8px] uppercase tracking-[0.3em] font-bold mb-2 border-b border-[#1e1b4b] pb-1 px-2">CARTRIDGE INVENTORY</p>
                     {games.map(g => (
                       <button
                         key={g.id}
                         onClick={(e) => {
                           e.currentTarget.blur();
                           handleInsertCartridge(g.id);
                         }}
                         disabled={powerState === 'off' || powerState === 'booting' || powerState === 'inserting'}
                         className="w-full text-left flex items-center gap-3 px-2 py-2 hover:bg-[#1e1b4b] rounded text-white font-mono text-xs uppercase disabled:opacity-50"
                       >
                         <span className="text-[#818cf8]">{g.icon}</span>
                         {g.label}
                       </button>
                     ))}
                  </div>
                </div>
              )}
`);

// 2. Add signature "by Rivad" visibly but subtle, in the Arcade CRT screen itself
// Lines 302-311
const screenRegex = /<div id="arcade-screen-container"/;
code = code.replace(screenRegex, `
            <div className="absolute bottom-2 right-4 z-50 pointer-events-none opacity-40 mix-blend-screen text-[#4ade80] font-mono text-[8px] tracking-[0.3em] font-black drop-shadow-[0_0_4px_#22c55e]">
               by Rivad
            </div>
            <div id="arcade-screen-container"`);

// 3. Improve the machine look. Add some text "RIVAD CORP" and physical detailing.
const titleRegex = /<h2 className="text-zinc-600 font-mono font-black tracking-\[0\.2em\] md:tracking-\[0\.5em\] text-xs md:text-xl drop-shadow-\[0_0_10px_rgba\(138,99,210,0\.8\)\] uppercase">SISYPHUS_OS_v3\.1<\/h2>/;
code = code.replace(titleRegex, `
            <div className="flex flex-col">
              <h2 className="text-zinc-500 font-mono font-black tracking-[0.2em] md:tracking-[0.5em] text-[8px] md:text-[10px] uppercase mb-1">RIVAD CORP ENTERTAINMENT SYSTEM</h2>
              <h2 className="text-zinc-700 font-mono font-black tracking-[0.2em] md:tracking-[0.4em] text-xs md:text-xl drop-shadow-[0_0_10px_rgba(138,99,210,0.4)] uppercase">SISYPHUS_OS_v3.1</h2>
            </div>`);

// 4. Improve the waiting screen to show a really nice OS interface instead of just black
const bootStateRegex = /\{\(powerState === 'booting' \|\| powerState === 'waiting' \|\| powerState === 'inserting'\) && \(/;
code = code.replace(bootStateRegex, `{(powerState === 'booting' || powerState === 'waiting' || powerState === 'inserting') && (`);

// Let's replace the bootlog rendering to include the visual grid when waiting.
const logRegex = /\{powerState === 'waiting' && <motion\.span animate=\{\{ opacity: \[1, 0\] \}\} transition=\{\{ repeat: Infinity, duration: 0\.8 \}\} className="inline-block w-3 h-5 bg-green-500 ml-1 translate-y-1"><\/motion\.span>\}/;
code = code.replace(logRegex, `{powerState === 'waiting' && (
   <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
      {games.map(g => (
         <button
            key={g.id}
            onClick={() => handleInsertCartridge(g.id)}
            className="border-2 border-green-500/50 bg-green-950/30 p-4 font-mono text-left hover:bg-green-500 hover:text-black transition-colors group flex items-center gap-4"
         >
            <div className="text-green-500 group-hover:text-black">{g.icon}</div>
            <div>
               <div className="font-bold text-sm">{g.label}</div>
               <div className="text-[10px] opacity-75">{g.title}</div>
            </div>
         </button>
      ))}
      <div className="col-span-1 md:col-span-2 text-center mt-4">
         <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-5 bg-green-500 translate-y-1 mr-2"></motion.span>
         <span className="text-[10px] uppercase tracking-widest break-all">A:\\> AWAITING SELECTION...</span>
      </div>
   </div>
)}`);


fs.writeFileSync('src/components/Arcade.tsx', code);
