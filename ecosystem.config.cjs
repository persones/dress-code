// pm2 process file. .cjs because package.json sets "type": "module" and pm2 loads this with require().
module.exports = {
  apps: [
    {
      name: 'dress-code',
      script: 'src/server/index.js',
      cwd: __dirname,
      env: {
        PORT: process.env.PORT || 3000,
      },
    },
  ],
};
