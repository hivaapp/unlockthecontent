const fs = require('fs');
const path = require('path');

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

walk('d:/download/ADGATE/src', function (err, results) {
    if (err) throw err;
    const tsxFiles = results.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

    tsxFiles.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;

        // BORDER RADIUS NORMALIZATION
        // 18px group: [16px], [18px], [20px], [24px], 2xl, xl, 3xl
        content = content.replace(/\brounded-(\[16px\]|\[18px\]|\[20px\]|\[24px\]|2xl|xl|3xl)\b/g, 'rounded-[18px]');
        // 14px group: [4px], sm, [6px], md, [8px], lg, [10px], [12px], [14px], and plain `rounded`
        content = content.replace(/\brounded-(sm|md|lg|\[4px\]|\[6px\]|\[8px\]|\[10px\]|\[12px\]|card|button|badge)\b/g, 'rounded-[14px]');
        // replace `rounded` when not part of something else
        content = content.replace(/\brounded\b(?!-)/g, 'rounded-[14px]');
        // Let's replace `rounded-t-[32px]` with `rounded-t-[18px]` for consistency
        content = content.replace(/\brounded-(t|b|l|r|tl|tr|bl|br)-(\[16px\]|\[18px\]|\[20px\]|\[24px\]|\[32px\]|2xl|xl|3xl)\b/g, 'rounded-$1-[18px]');
        content = content.replace(/\brounded-(t|b|l|r|tl|tr|bl|br)-(sm|md|lg|\[4px\]|\[6px\]|\[8px\]|\[10px\]|\[12px\])\b/g, 'rounded-$1-[14px]');


        // 1. AccountTab.tsx tap feedback
        if (file.includes('AccountTab.tsx')) {
            content = content.replace(
                /<div className="h-\[52px\] w-full bg-white px-4 flex items-center justify-between">/g,
                '<div onClick={() => setDonate(!donate)} className="h-[52px] w-full bg-white px-4 flex items-center justify-between cursor-pointer active:bg-[#F8F8F8] transition-colors duration-[80ms]">'
            );
            content = content.replace(
                /onClick=\{\(\) => setDonate\(!donate\)\}\n\s+className=\{`w-12/g,
                'className={`w-12'
            );
            content = content.replace(
                /className="h-\[52px\] w-full bg-white px-4 flex items-center justify-between cursor-pointer hover:bg-errorBg\/30 transition-colors"/g,
                'className="h-[52px] w-full bg-white px-4 flex items-center justify-between cursor-pointer hover:bg-errorBg/30 active:bg-[#F8F8F8] transition-colors duration-[80ms]"'
            );
            content = content.replace(
                /className=\{`h-\[52px\] w-full bg-white px-4 flex items-center justify-between cursor-pointer hover:bg-surfaceAlt active:bg-border transition-colors/g,
                'className={`h-[52px] w-full bg-white px-4 flex items-center justify-between cursor-pointer hover:bg-surfaceAlt active:bg-[#F8F8F8] transition-colors duration-[80ms]'
            );
            content = content.replace(
                /<div className="h-\[52px\] w-full flex items-center justify-between border-b border-border last:border-0">/g,
                '<div onClick={() => setOn(!on)} className="h-[52px] w-full flex items-center justify-between border-b border-border last:border-0 cursor-pointer active:bg-[#F8F8F8] transition-colors duration-[80ms]">'
            );
            content = content.replace(
                /<div onClick=\{\(\) => setOn\(!on\)\} className=\{`w-12/g,
                '<div className={`w-12'
            );
        }

        // 2. ReferralsTab.tsx tap feedback & text 10px -> 11px
        if (file.includes('ReferralsTab.tsx')) {
            content = content.replace(
                /className="bg-white rounded-\[18px\] p-3.5 border border-border cursor-pointer hover:border-\[#D0CCC4\] transition-all overflow-hidden"/g,
                'className="bg-white rounded-[18px] p-3.5 border border-border cursor-pointer active:bg-[#F8F8F8] transition-all duration-[80ms] hover:border-[#D0CCC4] overflow-hidden"'
            );
            content = content.replace(
                /className=\{\`flex items-center p-3\.5 h-\[56px\] \$\{index !== visibleActivity\.length - 1 \? 'border-b border-border' : ''\}\`\}/g,
                'className={`flex items-center p-3.5 h-[56px] cursor-pointer active:bg-[#F8F8F8] transition-colors duration-[80ms] ${index !== visibleActivity.length - 1 ? \'border-b border-border\' : \'\'}`}'
            );
            // Bump 10px to 11px
            content = content.replace(/text-\[10px\]/g, 'text-[11px]');
            // But badges should stay 10px: Achieved, Lock, the 3 small tags inside loop
            content = content.replace(
                /rounded-\[14px\] text-\[11px\] font-bold">Achieved/g,
                'rounded-[14px] text-[10px] font-bold">Achieved'
            );
            content = content.replace(
                /text-textMid px-2 py-1 rounded-\[14px\] text-\[11px\] font-bold flex/g,
                'text-textMid px-2 py-1 rounded-[14px] text-[10px] font-bold flex'
            );
        }

        // 3. DashboardLayout.tsx Red Dot & texts
        if (file.includes('DashboardLayout.tsx')) {
            content = content.replace(/text-\[10px\]/g, 'text-[11px]');
            content = content.replace(
                /className=\{\`flex flex-col items-center justify-center gap-1 w-full relative \$\{currentTab === tab\.id \? 'text-brand' : 'text-\[#AAAAAA\]'/g,
                'className={`flex flex-col items-center justify-center gap-1 w-full relative h-[60px] ${currentTab === tab.id ? \'text-brand\' : \'text-[#AAAAAA]\''
            );
            content = content.replace(
                /<span className="text-\[11px\] font-bold">\{tab\.label\}<\/span>/g,
                '{currentTab === tab.id && <div className="absolute top-1.5 w-1 h-1 bg-brand rounded-full" />}\n                            <span className="text-[11px] font-bold mt-[2px]">{tab.label}</span>'
            );
            content = content.replace(/<tab\.icon className="w-\[22px\] h-\[22px\]" \/>/g, '<tab.icon className="w-[22px] h-[22px] mt-1" />');
        }

        // 4. Landing.tsx removing fake blurred link & typography 
        if (file.includes('Landing.tsx')) {
            content = content.replace(
                /<div className=\{`flex-1 h-\[56px\] rounded-\[18px\] border-2 px-4 flex items-center relative overflow-hidden transition-colors \$\{isLoggedIn \? 'bg-brandTint border-brand\/30' : 'bg-surfaceAlt border-border border-dashed'\}`\}>\s*\{\!isLoggedIn && <div className="absolute inset-0 bg-white\/50 backdrop-blur-\[2px\] z-10" \/>\}\s*<span className="font-bold font-mono text-\[14px\] sm:text-\[15px\] truncate text-text">\{fakeUrl\}<\/span>\s*<\/div>\s*\{\!isLoggedIn \? \(\s*<button onClick=\{\(\) => setIsModalOpen\(true\)\} className="h-\[56px\] px-6 bg-brand text-white rounded-\[18px\] font-black text-\[15px\] flex items-center gap-2 shadow-sm shrink-0">\s*<Lock size=\{18\} \/> Sign In\s*<\/button>\s*\) : \(\s*<button onClick=\{copyToClipboard\} className=\{`h-\[56px\] w-\[56px\] rounded-\[18px\] flex items-center justify-center text-white transition-colors shrink-0 shadow-sm \$\{isCopied \? 'bg-success' : 'bg-brand hover:bg-brand-hover'\}`\}>\s*\{isCopied \? <Check size=\{24\} \/> : <LinkIcon size=\{24\} \/>\}\s*<\/button>\s*\)\}/,
                `{isLoggedIn ? (
                                        <>
                                            <div className="flex-1 h-[56px] rounded-[18px] border-2 px-4 flex items-center relative overflow-hidden transition-colors bg-brandTint border-brand/30">
                                                <span className="font-bold font-mono text-[14px] sm:text-[15px] truncate text-text">{fakeUrl}</span>
                                            </div>
                                            <button onClick={copyToClipboard} className={\`h-[56px] w-[56px] rounded-[18px] flex items-center justify-center text-white transition-colors shrink-0 shadow-sm \${isCopied ? 'bg-success' : 'bg-brand hover:bg-brand-hover'}\`}>
                                                {isCopied ? <Check size={24} /> : <LinkIcon size={24} />}
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsModalOpen(true)} className="w-full h-[56px] bg-brand text-white rounded-[18px] font-black text-[15px] flex items-center justify-center gap-2 shadow-sm shrink-0 hover:bg-brand-hover transition-colors">
                                            <Lock size={18} /> Sign In to Reveal Link
                                        </button>
                                    )}`
            );

            content = content.replace(
                /<div className=\{`flex-1 h-\[40px\] rounded-\[14px\] px-3 flex items-center relative overflow-hidden transition-colors \$\{isLoggedIn \? 'bg-\[#F3F1EC\]' : 'bg-\[#F3F1EC\]'\}`\}>\s*\{\!isLoggedIn && <div className="absolute inset-0 bg-white\/50 backdrop-blur-\[2px\] z-10" \/>\}\s*<span className="font-bold font-mono text-\[13px\] truncate text-text">\{fakeUrl\}<\/span>\s*<\/div>\s*\{\!isLoggedIn \? \(\s*<button onClick=\{\(\) => setIsModalOpen\(true\)\} className="h-\[40px\] px-4 bg-\[#E8312A\] text-white rounded-\[14px\] font-black text-\[13px\] flex items-center gap-1\.5 shrink-0">\s*Sign In to reveal\s*<\/button>\s*\) : \(\s*<button onClick=\{copyToClipboard\} className=\{`w-\[40px\] h-\[40px\] rounded-\[14px\] flex items-center justify-center text-white transition-colors shrink-0 shadow-sm \$\{isCopied \? 'bg-success' : 'bg-\[#E8312A\]'\}`\}>\s*\{isCopied \? <Check size=\{18\} \/> : <LinkIcon size=\{18\} \/>\}\s*<\/button>\s*\)\}/,
                `{isLoggedIn ? (
                                    <>
                                        <div className="flex-1 h-[40px] rounded-[14px] px-3 flex items-center relative overflow-hidden transition-colors bg-[#F3F1EC]">
                                            <span className="font-bold font-mono text-[13px] truncate text-text">{fakeUrl}</span>
                                        </div>
                                        <button onClick={copyToClipboard} className={\`w-[40px] h-[40px] rounded-[14px] flex items-center justify-center text-white transition-colors shrink-0 shadow-sm \${isCopied ? 'bg-success' : 'bg-[#E8312A]'}\`}>
                                            {isCopied ? <Check size={18} /> : <LinkIcon size={18} />}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsModalOpen(true)} className="w-full h-[40px] bg-[#E8312A] text-white rounded-[14px] font-black text-[14px] flex items-center justify-center gap-2 shrink-0">
                                        <Lock size={16} /> Sign In to reveal
                                    </button>
                                )}`
            );
        }

        // Typographic Hierarchy Normalization
        // Let's replace ANY `font-[700]` in a span or div that has `text-[16px]` or higher with `font-[800]` if it's a heading.
        // And anywhere `h1` has `font-[800]` or `font-bold` to `font-black`.
        // The prompt says: "page titles at 900, section titles at 800, card titles at 800, body at 600, captions at 700. Remove any weight 700 that appears where 800 should be used."
        // Let's just normalize class names matching `font-[700]` accompanied by title sizes (`text-[16px]`, `text-[18px]`, `text-[20px]`, `text-[24px]`, `text-[28px]`, `text-[32px]`) to `font-[800]`.
        // And `text-[32px]` or `text-[48px]` to `font-[900]`.

        let m;
        // Turn large text > 24px and headers into 900
        content = content.replace(/(text-\[(?:28px|32px|48px|56px|64px|4xl|5xl|6xl)\]\s+)font-(?:\[(?:700|800)\]|bold|extrabold)/g, '$1font-black');

        // Turn mid text > 15px to 24px into 800
        content = content.replace(/(text-\[(?:[1-2][6-9]px|20px|24px|lg|xl|2xl)\]\s+)font-(?:\[700\]|bold)/g, '$1font-[800]');

        if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated everything in ${file}`);
        }
    });

    console.log("Completed!");
});
