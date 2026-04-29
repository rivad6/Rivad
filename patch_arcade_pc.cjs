const fs = require('fs');
const path = require('path');

let arcFile = path.join(__dirname, 'src/components/Arcade.tsx');
let content = fs.readFileSync(arcFile, 'utf8');

// Update labels
// "SISYPHUS_ENTERTAINMENT" -> "SISYPHUS OS v1.0"
content = content.replace(/SISYPHUS_ENTERTAINMENT/, 'SISYPHUS_OS_v3.1');

// Change cartridge insertion text
content = content.replace(/arc\.select_cartridge/g, 'arc.select_floppy');

// Floppy Disks instead of Cartridges UI!
content = content.replace(/{games\.map\(\(g\) => \([\s\S]*?<\/motion\.button>\s*}\)/, `{games.map((g) => (
                  <motion.button
                    key={g.id}
                    onClick={() => handleInsertCartridge(g.id)}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                    disabled={powerState === 'off' || powerState === 'booting' || powerState === 'inserting'}
                    className={\`flex-shrink-0 relative w-24 h-24 md:w-32 md:h-32 rounded-sm border-2 border-zinc-700 bg-zinc-800 flex flex-col items-center justify-start p-1.5 md:p-2 shadow-[2px_2px_0_rgba(0,0,0,0.8)] transition-colors overflow-hidden \${activeGame === g.id ? 'border-brand-accent -translate-y-4 shadow-[0_10px_20px_rgba(var(--color-brand-accent-rgb),0.3)]' : 'hover:border-zinc-500'} \${(powerState === 'off' || powerState === 'booting') ? 'opacity-50 cursor-not-allowed' : ''}\`}
                  >
                    {/* Metal Slider */}
                    <div className="absolute top-0 right-4 w-8 h-8 bg-zinc-300 border-x border-b border-zinc-500 rounded-b-sm flex justify-center py-1">
                       <div className="w-3 h-5 bg-zinc-800 rounded-sm"></div>
                    </div>
                    {/* Label Area */}
                    <div className={\`w-full h-12 md:h-16 mt-6 border border-zinc-900 \${g.color} relative overflow-hidden flex flex-col items-center justify-center p-1 rounded-sm shadow-inner\`}>
                      <span className="text-white drop-shadow-md block scale-75 md:scale-100">{g.icon}</span>
                      <span className="text-[7px] md:text-[9px] text-white font-mono font-black text-center z-10 leading-tight tracking-wider uppercase mt-1 drop-shadow-md">{g.label}</span>
                    </div>
                  </motion.button>
                ))}`);

// Fix the Boot Log Texts to sound more MS-DOS
content = content.replace(/const lines = \[[^\]]+\];/, 
`const lines = [
        "BIOS DATE 04/23/94 14:32:00 VER 1.0",
        "CPU: Intel 486 DX2-66 MHz",
        "Memory Test: 8192K OK",
        "Loading Sisyphus OS...",
        "Device Drivers Loaded.",
        "Sound Blaster Compatible Audio Base 220 IRQ 5.",
        "CD-ROM DEVICE DRIVER INSTALLED.",
        "",
        "A:\\\\> WAIT FOR INPUT..."
      ];`);

// Fix the booting UI inside inserting State
content = content.replace(/setBootLog\(\[t\('arc\.boot\.loading'\), t\('arc\.boot\.verify'\), t\('arc\.boot\.rom'\), t\('arc\.boot\.start'\)\]\);/g, 
`setBootLog(["A:\\\\> READ DRIVE A...", "LOCATING EXECUTABLE...", "LOADING TO RAM...", "EXECUTING..."]);`);

// Change the Arcade border to look more like a CRT monitor / Vintage PC Beige or dark grey Box
content = content.replace(/border-x-\[8px\] md:border-x-\[16px\] border-y-\[12px\] md:border-y-\[24px\] border-\[#18181b\]/, "border-x-[12px] md:border-x-[20px] border-y-[16px] md:border-y-[30px] border-[#ced0c8]");
content = content.replace(/bg-\[#222222\]/g, "bg-[#d8dad3]"); // Beige PC
content = content.replace(/text-\[#8a63d2\]/, "text-zinc-600"); // less neon logo on the beige case

// Change color of CRT Frame
content = content.replace(/bg-\[#05040a\] border-\[8px\] md:border-\[12px\] border-\[#111\]/, "bg-[#111614] border-[16px] md:border-[24px] border-[#b0b3ab] rounded-[2rem]");

// Vintage keyboard styling instead of arcade control board
content = content.replace(/{\/\* Arcade Cabinet Control Area \*\/}[\s\S]*?(?=<\/div>\s*{\/\* End of arcadeCabinetRef \*\/})/, 
`{/* Vintage PC Keyboard & Drive Area */}
          <div className="mt-8 flex flex-col md:flex-row justify-between items-center px-4 md:px-12 bg-[#CED0C8] py-6 rounded-xl border-t-2 border-white/50 border-b-8 border-[#9a9b95] shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative z-10 gap-6">
             {/* Decorative Floppy Drive */}
             <div className="flex flex-col gap-2 bg-[#b0b3ab] p-3 rounded border-2 border-[#82847e] shadow-inner w-full md:w-64">
                <div className="bg-[#111] h-3 w-full rounded-sm relative">
                   <div className="absolute top-1/2 -translate-y-1/2 right-2 w-4 h-1 bg-[#111] rounded shadow-inner"></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                   <div className={\`w-2 h-2 rounded-full shadow-inner \${powerState === 'inserting' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-red-900'}\`}></div>
                   <button onClick={() => playSound('hit')} className="w-6 h-3 bg-[#d8dad3] border border-[#a0a29c] rounded-sm hover:translate-y-px transition-transform"></button>
                </div>
             </div>
             
             {/* Vintage Keyboard Layout chunk */}
             <div className="flex gap-6 items-center">
                {/* Arrow Keys */}
                <div className="flex flex-col items-center gap-1">
                   <button onMouseDown={() => startHoldKey('ArrowUp')} onMouseUp={() => stopHoldKey('ArrowUp')} className="w-10 h-10 md:w-12 md:h-12 bg-[#e0e2dc] border-b-4 border-[#b0b3ab] rounded shadow-sm hover:translate-y-1 hover:border-b-0 transition-all font-bold text-zinc-500">↑</button>
                   <div className="flex gap-1">
                     <button onMouseDown={() => startHoldKey('ArrowLeft')} onMouseUp={() => stopHoldKey('ArrowLeft')} className="w-10 h-10 md:w-12 md:h-12 bg-[#e0e2dc] border-b-4 border-[#b0b3ab] rounded shadow-sm hover:translate-y-1 hover:border-b-0 transition-all font-bold text-zinc-500">←</button>
                     <button onMouseDown={() => startHoldKey('ArrowDown')} onMouseUp={() => stopHoldKey('ArrowDown')} className="w-10 h-10 md:w-12 md:h-12 bg-[#e0e2dc] border-b-4 border-[#b0b3ab] rounded shadow-sm hover:translate-y-1 hover:border-b-0 transition-all font-bold text-zinc-500">↓</button>
                     <button onMouseDown={() => startHoldKey('ArrowRight')} onMouseUp={() => stopHoldKey('ArrowRight')} className="w-10 h-10 md:w-12 md:h-12 bg-[#e0e2dc] border-b-4 border-[#b0b3ab] rounded shadow-sm hover:translate-y-1 hover:border-b-0 transition-all font-bold text-zinc-500">→</button>
                   </div>
                </div>
                
                {/* Action Keys */}
                <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                     <button onMouseDown={() => startHoldKey(' ')} onMouseUp={() => stopHoldKey(' ')} className="w-32 h-10 md:h-12 bg-[#e0e2dc] border-b-4 border-[#b0b3ab] rounded shadow-sm hover:translate-y-1 hover:border-b-0 transition-all font-mono text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-center">SPACE</button>
                   </div>
                   <div className="flex gap-2">
                     <button onMouseDown={() => startHoldKey('Enter')} onMouseUp={() => stopHoldKey('Enter')} className="flex-1 h-10 md:h-12 bg-[#e0e2dc] border-b-4 border-[#b0b3ab] rounded shadow-sm hover:translate-y-1 hover:border-b-0 transition-all font-mono text-xs font-bold text-zinc-500 uppercase flex items-center justify-center">ENTER</button>
                     <button onMouseDown={() => { stopHoldKey('Escape'); startHoldKey('Escape'); }} onMouseUp={() => stopHoldKey('Escape')} className="w-16 h-10 md:h-12 bg-[#d69f9f] border-b-4 border-[#b57a7a] rounded shadow-sm hover:translate-y-1 hover:border-b-0 transition-all font-mono text-xs font-bold text-red-900 uppercase flex items-center justify-center">ESC</button>
                   </div>
                </div>
             </div>
          </div>
`);

fs.writeFileSync(arcFile, content);
