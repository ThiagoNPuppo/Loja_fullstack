'use strict';

/**
 * produto controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::produto.produto', ({ strapi }) => ({
  // Função para obter todos os registros de produtos
  async find(ctx) {
    // Use a ação padrão do core para obter os dados
    const { data, meta } = await super.find(ctx);

    // Sanitizar os dados para remover os campos createdAt, updatedAt e publishedAt
    const sanitizedData = data.map(entity => {
      const sanitizedEntity = { ...entity };
      delete sanitizedEntity.attributes.createdAt;
      delete sanitizedEntity.attributes.updatedAt;
      delete sanitizedEntity.attributes.publishedAt;
      return sanitizedEntity;
    });

    // Ordenar os dados sanitizados pelo campo id em ordem numérica
    sanitizedData.sort((a, b) => a.id - b.id);

    // Retornar os dados sanitizados e ordenados
    return { data: sanitizedData, meta };
  },

  // Função para obter um registro específico de produto
  async findOne(ctx) {
    const { id } = ctx.params;

    // Obter a entidade específica pelo id
    const entity = await strapi.service('api::produto.produto').findOne({ id });

    // Sanitizar a entidade para remover os campos createdAt, updatedAt e publishedAt
    const sanitizedEntity = { ...entity };
    delete sanitizedEntity.createdAt;
    delete sanitizedEntity.updatedAt;
    delete sanitizedEntity.publishedAt;

    // Retornar a entidade sanitizada
    return this.transformResponse(sanitizedEntity);
  },

  // Função para criar um novo produto com verificação de duplicados
  async create(ctx) {
    const { data } = ctx.request.body;
    const { Nome, Preco, Descricao } = data;

    // Verificar se já existe um produto com os mesmos atributos (Nome, Preco e Descricao)
    const existingProducts = await strapi.entityService.findMany('api::produto.produto', {
      filters: { Nome, Preco, Descricao },
    });

    // Se existir um produto duplicado, retornar uma mensagem de erro
    if (existingProducts.length > 0) {
      return ctx.badRequest('Produto já existe.');
    }

    // Se não existir um produto duplicado, criar o novo produto
    const response = await super.create(ctx);

    // Sanitizar a entidade para remover os campos createdAt, updatedAt e publishedAt
    const sanitizedData = { ...response.data };
    delete sanitizedData.attributes.createdAt;
    delete sanitizedData.attributes.updatedAt;
    delete sanitizedData.attributes.publishedAt;

    // Retornar a entidade sanitizada
    return { data: sanitizedData, meta: response.meta };
  },
}));
