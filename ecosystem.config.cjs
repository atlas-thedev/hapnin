module.exports = {
  apps: [
    {
      name: "hapnin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3600 -H 127.0.0.1",
      env: { NODE_ENV: "production", TZ: "Asia/Colombo" },
      max_memory_restart: "600M",
    },
  ],
};
