module.exports = {
  apps: [
    {
      name: "mocktest-backend",
      script: "src/app.js",
      instances: "max", // Or a specific number like 1, 2
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
