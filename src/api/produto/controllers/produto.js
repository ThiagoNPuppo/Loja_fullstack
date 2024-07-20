'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::produto.produto', ({ strapi }) => ({
  async create(ctx) {
    // @ts-ignore
    const { data } = ctx.request.body;

    // Verifica se já existe um produto com o mesmo nome, descrição e preço
    const existingProduct = await strapi.entityService.findMany('api::produto.produto', {
      filters: {
        nome: data.nome,
        descricao: data.descricao,
        preco: data.preco,
      },
    });

    if (existingProduct.length > 0) {
      return ctx.badRequest('Produto com o mesmo nome, descrição e preço já existe.');
    }

    // Chama a função de criação padrão do Strapi
    return await super.create(ctx);
  },

  async find(ctx) {
    const { data, meta } = await super.find(ctx.query.sort ? ctx : { ...ctx, query: { ...ctx.query, sort: 'id:asc' } });

    const produtos = await Promise.all(data.map(async produto => {
      const imagem = produto.attributes.imagem ? produto.attributes.imagem.url : null;

      return {
        id: produto.id,
        nome: produto.attributes.nome,
        preco: produto.attributes.preco,
        qtd_estoque: produto.attributes.qtd_estoque,
        descricao: produto.attributes.descricao,
        imagem,
      };
    }));

    return { data: produtos, meta };
  },

  async findOne(ctx) {
    const { data } = await super.findOne(ctx);

    const produto = {
      id: data.id,
      nome: data.attributes.nome,
      preco: data.attributes.preco,
      qtd_estoque: data.attributes.qtd_estoque,
      descricao: data.attributes.descricao,
      imagem: data.attributes.imagem ? data.attributes.imagem.url : null,
    };

    return { data: produto };
  },
}));