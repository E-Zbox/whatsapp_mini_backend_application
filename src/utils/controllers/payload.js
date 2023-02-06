exports.createPayload = (body) => ({ body, date: Date.now() });

exports.createAdminPayload = (body) => this.createPayload(`${body} ~Mazi🐯`);
