const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const dmcaRegex = /const DMCAModal[\s\S]*?(?=const AdminLogin)/;

const newLegalModal = `const LegalModal: React.FC<{ type: string | null, onClose: () => void }> = ({ type, onClose }) => {
  if (!type) return null;
  
  const content = {
    dmca: {
      title: 'DMCA / Copyright Policy',
      icon: <Shield className="text-red-500" size={32} />,
      body: (
        <>
          <p>
            Movie Wallah respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at <a href="http://www.copyright.gov/legislation/dmca.pdf" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">http://www.copyright.gov/legislation/dmca.pdf</a>, we will respond expeditiously to claims of copyright infringement committed using the Movie Wallah service that are reported to our Designated Copyright Agent.
          </p>
          
          <h3 className="text-xl font-bold text-white mt-4">Takedown Request Process</h3>
          <p>
            If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to our Designated Copyright Agent. Upon receipt of the Notice as described below, we will take whatever action, in our sole discretion, we deem appropriate, including removal of the challenged material from the Site.
          </p>
          
          <div className="bg-black/50 p-6 rounded-2xl border border-white/5 mt-4">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <Mail size={18} className="text-red-400" /> 
              Designated Copyright Agent
            </h4>
            <p className="text-sm text-white/60 mb-1">Send your takedown notices to:</p>
            <p className="font-mono text-red-400">moviewallah.online@gmail.com</p>
          </div>
          
          <p className="text-sm text-white/50 mt-4">
            Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing may be subject to liability.
          </p>
        </>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      icon: <Lock className="text-red-500" size={32} />,
      body: (
        <>
          <p>Welcome to Movie Wallah's Privacy Policy. Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use our services.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Information We Collect</h3>
          <p>We do not collect personally identifiable information from regular visitors. If you are an administrator, we collect your email address for authentication purposes. We may collect anonymous analytics data such as browser type, device type, and referring pages to improve our service.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">How We Use Your Information</h3>
          <p>The anonymous data we collect is solely used to understand how our users interact with the site, allowing us to enhance the user experience and optimize our content delivery. We do not sell, rent, or share your information with third parties.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Cookies</h3>
          <p>We may use cookies or similar tracking technologies to store your preferences and session information (e.g., keeping you logged in as an administrator). You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Third-Party Links</h3>
          <p>Our site may contain links to third-party websites or services that are not owned or controlled by Movie Wallah. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.</p>
        </>
      )
    },
    disclaimer: {
      title: 'Disclaimer',
      icon: <AlertTriangle className="text-red-500" size={32} />,
      body: (
        <>
          <p>The information and content provided on Movie Wallah is for general informational and entertainment purposes only.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Content Liability</h3>
          <p>Movie Wallah does not host any video files on its servers. All videos and movies are hosted on third-party services and are publicly available on the internet. We simply provide links to these files in an organized format.</p>
          <p>We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">No Warranties</h3>
          <p>The site and all content and services provided on the site are provided on an "as is" and "as available" basis without any warranty or condition, express, implied, or statutory. We do not warrant that the site will be uninterrupted, timely, secure, or error-free.</p>
        </>
      )
    },
    terms: {
      title: 'Terms of Service',
      icon: <FileText className="text-red-500" size={32} />,
      body: (
        <>
          <p>By accessing or using Movie Wallah, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Use of Service</h3>
          <p>You agree to use the site only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the site. Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our site.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Intellectual Property</h3>
          <p>The site and its original content (excluding the movies and videos linked, which are the property of their respective owners), features, and functionality are owned by Movie Wallah and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Changes to Terms</h3>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
        </>
      )
    }
  };

  const activeContent = content[type as keyof typeof content];

  if (!activeContent) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="w-full max-w-3xl glass-panel rounded-3xl p-6 md:p-10 bg-zinc-900/90 border border-white/10 my-8 flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-white/10 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            {activeContent.icon}
            {activeContent.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-6 text-white/80 leading-relaxed">
          {activeContent.body}
        </div>
      </motion.div>
    </motion.div>
  );
};
`;

code = code.replace(dmcaRegex, newLegalModal);
fs.writeFileSync('src/App.tsx', code);
