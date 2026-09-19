const fs = require('fs');
const files = [
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\responder\\LogoutButton.tsx",
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\app\\responder\\access\\page.tsx",
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\shell\\LanguageSwitcher.tsx",
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\responder\\ResponderCasePanel.tsx",
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\shell\\TopBar.tsx",
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\app\\responder\\ResponderDashboardClient.tsx",
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\app\\responder\\page.tsx",
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\landing\\LandingContent.tsx"
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.endsWith("\\n")) {
    content = content.slice(0, -2);
    fs.writeFileSync(f, content, 'utf8');
  }
});
console.log("Fixed \\n");
