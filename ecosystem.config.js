module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'npm',
      args: 'start',
      exp_backoff_restart_delay: 100,
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_file: './logs/backend-combined.log',
      combine_logs: true,
    },
  ],
};
