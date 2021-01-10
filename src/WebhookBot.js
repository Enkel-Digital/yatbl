/**
 * Webhook bot with a basic built in server implementation.
 * @todo startServer and setWebhook should be "seperate" methods as users might want to use builtin method to set webhook, but want to run their own webhook server.
 */

const Bot = require("./bot");
const startServer = require("./server");

class WebhookBot extends Bot {
  // Instance variables. Most are defined here more for documentation purposes than anything.
  _webhookServer; // Reference to the integrated webhook server

  /**
   * @param {String} BOT_TOKEN Telegram Bot token from bot father
   * @param {Object} configurations Used to configure the bot, changing the default configs
   */
  constructor(BOT_TOKEN, configurations = {}) {
    super(BOT_TOKEN, configurations);
  }

  /**
   * Start a webhook server and Set/Register webhook URL with telegram server
   * @note Default url follows telegram API standard of using the base API url where bot token is used, but allow user to override using options
   * @param {*} [PORT=3000]
   * @return {boolean} @todo If webhook server successfully started
   */
  async startServer(PORT = 3000) {
    // Start the webhook server and save reference to the server
    // Call the startServer function with "call" method to bind "this" which is the current instance of the WebhookBot
    // This is because onUpdate functions needs a "this" binding that is a instance of the Bot Class,
    // Thus we are passing the current instance to startServer, which will call onUpdate with this instance binded to "this"
    this._webhookServer = startServer.call(
      this,
      PORT,
      this._BOT_TOKEN,
      this._onUpdate,
      this.apiErrorHandler
    );
  }

  /**
   * Set/Register webhook URL with telegram server. Run this only after server is started and ready for incoming updates.
   * Reference: https://core.telegram.org/bots/api#setwebhook
   * @note Default url path follows telegram API standard of using bot token as the base API url, but allow user to override using options.path
   * @param {String} url HTTPS URL to send updates to, options.path or bot token will be appended to path.
   * @param {Object} [options={}] Options object for registering the API, refer to telegram API reference
   * @return {boolean} If webhook is successfully set
   */
  async setWebhook(url, options = {}) {
    // Validate url and ensure it is https first
    try {
      const urlObject = new URL(url);
      if (urlObject.protocol !== "https:") throw new Error();
    } catch (_) {
      // Catch and re-throw with specific error message
      throw new Error(
        "Invalid Webhook URL! See 'https://core.telegram.org/bots/api#setwebhook'"
      );
    }

    // Get webhook url path, either from options or following telegram's recommendations, use the bot token (set on object by the constructor)
    const urlPath = options.path || this._BOT_TOKEN;
    // If path is specified in options, delete before spreading options object onto setWebhook API call request body
    if (options.path) delete options.path;

    await this.tapi("setWebhook", {
      url: url + urlPath,
      ...options,
    });

    // @todo Get the webhook info to ensure webhook is properly set

    return true;
  }

  /**
   * Refer to the setWebhook and startServer methods for more details.
   * This function just wraps over these 2 methods
   * @param {Object} options https://core.telegram.org/bots/api#setwebhook
   *
   * @todo Maybe add a try catch or smth?
   * @todo Add a return value perhaps?
   */
  async setWebhookAndStartServer(options) {
    // Start server first before setting up webhook integration with telegram API to ensure
    // server is up and running before telegram API attempts to send any updates.
    await this.startServer(options.PORT);
    await this.setWebhook(options);
  }

  /**
   * @return {boolean} Boolean returned to determine if webhook is successfully removed
   * @todo Split this up to be a delete webhook and stop server
   */
  async deleteWebhook() {
    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/`;

      // Remove webhook first to ensure telegram stop sending updates to the webhook server
      await this.tapi("deleteWebhook", {
        url,
        ...options,
      });

      // @todo Get webhook info to ensure webhook is properly removed

      // Close the server once all current updates have been processed
      // Wrapped in a Promise to use async/await
      await new Promise((resolve, reject) =>
        this._webhookServer.close((err) => (err ? reject(err) : resolve()))
      );

      console.log("Internal webhook server closed");
      return true;
    } catch (error) {
      console.error("Failed to close internal webhook server");
      console.error(error);
      return false;
    }
  }
}

module.exports = WebhookBot;
