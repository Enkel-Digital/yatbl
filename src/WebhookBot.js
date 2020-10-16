/**
 * Webhook bot with a basic built in server implementation.
 * @todo startServer and setWebhook should be "seperate" methods as users might want to use builtin method to set webhook, but want to run their own webhook server.
 */

const Bot = require("./bot");

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
    this._webhookServer = startServer(PORT, this._BOT_TOKEN, {
      _onUpdate: this._onUpdate,
      apiErrorHandler: this.apiErrorHandler,
    });
  }

  /**
   * Start a webhook server and Set/Register webhook URL with telegram server
   * @note Default url follows telegram API standard of using the base API url where bot token is used, but allow user to override using options
   * @param {object} [options={}] Options object for registering the API. Ref to https://core.telegram.org/bots/api#setwebhook
   * @return {boolean} If webhook is successfully set
   */
  async setWebhook(options = {}) {
    await this.tapi("setWebhook", {
      url: `https://api.telegram.org/bot${BOT_TOKEN}/`,
      ...options,
    });

    // @todo Get the webhook info to ensure webhook is properly set

    return true;
  }

  async setWebhookAndStartServer(PORT, options) {
    // Maybe add a try catch or smth?
    // Add a return value perhaps?
    await this.setWebhook(options);
    await this.startServer(PORT);
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
