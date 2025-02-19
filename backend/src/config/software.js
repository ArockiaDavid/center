// List of development software with package names, descriptions and icons
const devSoftwareList = [
  { 
    id: 'visual-studio-code', 
    name: 'Visual Studio Code', 
    description: 'Code editing. Redefined.',
    isCask: true,
    icon: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_vscode.svg'
  },
  { 
    id: 'pycharm-ce', 
    name: 'PyCharm CE', 
    description: 'Python IDE for Professional Developers',
    isCask: true,
    icon: 'https://resources.jetbrains.com/storage/products/pycharm/img/meta/pycharm_logo_300x300.png'
  },
  { 
    id: 'python', 
    name: 'Python', 
    description: 'Interpreted, high-level programming language', 
    isCask: false,
    icon: 'https://www.python.org/static/community_logos/python-logo-generic.svg'
  },
  { 
    id: 'anaconda', 
    name: 'Anaconda', 
    description: 'Python distribution for scientific computing',
    isCask: true,
    icon: 'https://www.anaconda.com/assets/images/anaconda-meta.png'
  },
  { 
    id: 'intellij-idea-ce', 
    name: 'IntelliJ IDEA CE', 
    description: 'Java IDE for Professional Developers',
    isCask: true,
    icon: 'https://resources.jetbrains.com/storage/products/intellij-idea/img/meta/intellij-idea_logo_300x300.png'
  },
  { 
    id: 'git', 
    name: 'Git', 
    description: 'Distributed version control system', 
    isCask: false,
    icon: 'https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png'
  },
  { 
    id: 'github', 
    name: 'GitHub Desktop', 
    description: 'GitHub desktop client',
    isCask: true,
    icon: 'https://desktop.github.com/images/desktop-icon.svg'
  },
  { 
    id: 'jira', 
    name: 'Jira', 
    description: 'Project management tool',
    isCask: false,
    icon: 'https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png'
  },
  { 
    id: 'confluence', 
    name: 'Confluence', 
    description: 'Team collaboration software',
    isCask: true,
    icon: 'https://wac-cdn.atlassian.com/assets/img/favicons/confluence/favicon.png'
  },
  { 
    id: 'java', 
    name: 'Java', 
    description: 'OpenJDK Development Kit', 
    isCask: false,
    icon: 'https://dev.java/assets/images/java-logo-vert-blk.png'
  },
  { 
    id: 'power-bi', 
    name: 'Power BI', 
    description: 'Interactive data visualization software',
    isCask: true,
    icon: 'https://powerbi.microsoft.com/pictures/application-logos/svg/powerbi.svg'
  },
  { 
    id: 'snowflake-snowsql', 
    name: 'Snowflake SnowSQL', 
    description: 'Snowflake command line client',
    isCask: false,
    icon: 'https://www.snowflake.com/wp-content/themes/snowflake/img/snowflake-logo-blue.svg'
  },
  { 
    id: 'swagger-editor', 
    name: 'Swagger Editor', 
    description: 'OpenAPI editor',
    isCask: true,
    icon: 'https://swagger.io/swagger/media/assets/images/swagger-logo.svg'
  },
  { 
    id: 'spyder', 
    name: 'Spyder', 
    description: 'Scientific Python Development Environment',
    isCask: true,
    icon: 'https://www.spyder-ide.org/static/images/spyder-logo.svg'
  },
  { 
    id: 'eclipse-ide', 
    name: 'Eclipse IDE', 
    description: 'Eclipse integrated development environment',
    isCask: true,
    icon: 'https://www.eclipse.org/downloads/assets/public/images/logo-eclipse.png'
  },
  { 
    id: 'figma', 
    name: 'Figma', 
    description: 'Collaborative interface design tool',
    isCask: true,
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg'
  },
  { 
    id: 'docker', 
    name: 'Docker', 
    description: 'Container runtime and manager', 
    isCask: true,
    icon: 'https://www.docker.com/sites/default/files/d8/styles/role_icon/public/2019-07/Moby-logo.png'
  },
  { 
    id: 'node', 
    name: 'Node.js', 
    description: 'JavaScript runtime environment', 
    isCask: false,
    icon: 'https://nodejs.org/static/images/logo.svg'
  },
  { 
    id: 'npm', 
    name: 'npm', 
    description: 'Node package manager', 
    isCask: false,
    icon: 'https://raw.githubusercontent.com/npm/logos/master/npm%20logo/npm-logo-red.svg'
  },
  { 
    id: 'nvm', 
    name: 'nvm', 
    description: 'Node Version Manager', 
    isCask: false,
    icon: 'https://raw.githubusercontent.com/nvm-sh/logos/master/nvm-logo-color.svg'
  },
  { 
    id: 'tomcat', 
    name: 'Apache Tomcat', 
    description: 'Java Servlet container', 
    isCask: false,
    icon: 'https://tomcat.apache.org/res/images/tomcat.png'
  },
  { 
    id: 'awscli', 
    name: 'AWS CLI', 
    description: 'Amazon Web Services CLI', 
    isCask: false,
    icon: 'https://aws.amazon.com/favicon.ico'
  },
  { 
    id: 'jenkins', 
    name: 'Jenkins', 
    description: 'Automation server', 
    isCask: false,
    icon: 'https://www.jenkins.io/images/logos/jenkins/jenkins.png'
  },
  { 
    id: 'ansible', 
    name: 'Ansible', 
    description: 'Automation tool', 
    isCask: false,
    icon: 'https://www.ansible.com/hubfs/2016_Images/Assets/Ansible-Mark-Large-RGB-Black.png'
  },
  { 
    id: 'grafana', 
    name: 'Grafana', 
    description: 'Analytics & monitoring solution',
    isCask: false,
    icon: 'https://grafana.com/static/img/menu/grafana2.svg'
  },
  { 
    id: 'jupyter', 
    name: 'Jupyter', 
    description: 'Interactive computing', 
    isCask: false,
    icon: 'https://jupyter.org/assets/logos/jupyter/jupyter.svg'
  },
  { 
    id: 'r', 
    name: 'R', 
    description: 'Statistical computing language', 
    isCask: false,
    icon: 'https://www.r-project.org/logo/Rlogo.svg'
  },
  { 
    id: 'rstudio', 
    name: 'RStudio', 
    description: 'R IDE',
    isCask: true,
    icon: 'https://www.rstudio.com/wp-content/uploads/2018/10/RStudio-Logo.svg'
  },
  { 
    id: 'postman', 
    name: 'Postman', 
    description: 'API Development Environment',
    isCask: true,
    icon: 'https://www.postman.com/assets/logos/postman-logo.svg'
  },
  { 
    id: 'mobaxterm', 
    name: 'MobaXterm', 
    description: 'Enhanced terminal for Windows',
    isCask: true,
    icon: 'https://mobaxterm.mobatek.net/img/moba/xterm_logo.png'
  },
  { 
    id: 'studio-3t', 
    name: 'Studio 3T', 
    description: 'MongoDB GUI',
    isCask: true,
    icon: 'https://studio3t.com/wp-content/uploads/2020/07/studio-3t-circle.svg'
  },
  { 
    id: 'visual-studio', 
    name: 'Visual Studio', 
    description: 'Microsoft IDE',
    isCask: true,
    icon: 'https://visualstudio.microsoft.com/wp-content/uploads/2019/06/BrandVisualStudioWin2019-3.svg'
  },
  { 
    id: 'sublime-text', 
    name: 'Sublime Text', 
    description: 'Text editor for code',
    isCask: true,
    icon: 'https://www.sublimetext.com/images/icon.png'
  },
  { 
    id: 'webstorm', 
    name: 'WebStorm', 
    description: 'JavaScript IDE',
    isCask: true,
    icon: 'https://resources.jetbrains.com/storage/products/webstorm/img/meta/webstorm_logo_300x300.png'
  },
  { 
    id: 'dbeaver-community', 
    name: 'DBeaver', 
    description: 'Universal Database Tool',
    isCask: true,
    icon: 'https://dbeaver.io/wp-content/uploads/2015/09/beaver-head.png'
  }
];

module.exports = {
  devSoftwareList
};
