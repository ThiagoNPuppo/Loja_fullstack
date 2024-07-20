'use strict';

/**
 * cliente controller
 */

const { createCoreController } = require('@strapi/strapi').factories;


module.exports = createCoreController('api::cliente.cliente', ({ strapi }) => ({
  async create(ctx) {
    // @ts-ignore
    const { cpf } = ctx.request.body.data;

    const existeCliente = await strapi.query('api::cliente.cliente').findOne( { where: { cpf }}); //verificar ase cpf ja existe

    if (existeCliente) {
      return ctx.badRequest('Cliente ja cadastrado.');
    }

    return await super.create(ctx);
  },

  async find(ctx) {
    const { data, meta } = await super.find(ctx.query.sort ? ctx : { ...ctx, query: { ...ctx.query, sort: 'id:asc' } });

    const clientes = data.map(cliente => ({
      id: cliente.id,
      nome: cliente.attributes.nome,
      cpf: cliente.attributes.cpf,
      email: cliente.attributes.email,
      telefone: cliente.attributes.telefone,
    }));

    clientes.sort((a, b) => a.id - b.id);

    return { data: clientes, meta };
  },
}));
