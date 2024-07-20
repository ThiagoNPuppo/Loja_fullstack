'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pedido.pedido', ({ strapi }) => ({
  // Função para criar um novo pedido
  async create(ctx) {
    // @ts-ignore
    const { data } = ctx.request.body;
    const { produtos, cliente } = data;

    // Calcula o valor total do pedido
    let valorTotal = 0;
    for (const produtoId of produtos) {
      const produto = await strapi.entityService.findOne('api::produto.produto', produtoId);
      if (produto) {
        valorTotal += produto.preco;
      }
    }

    // Atualiza o campo 'valor' com o valor total calculado
    data.valor = valorTotal;

    // Chama a função de criação padrão do Strapi
    const response = await super.create(ctx);

    // Atualiza o estoque dos produtos
    for (const produtoId of produtos) {
      const produto = await strapi.entityService.findOne('api::produto.produto', produtoId);
      if (produto.qtd_estoque > 0) {
        await strapi.entityService.update('api::produto.produto', produtoId, {
          data: {
            qtd_estoque: produto.qtd_estoque - 1,
          },
        });
      } else {
        return ctx.badRequest(`Produto ${produto.nome} está fora de estoque.`);
      }
    }

    // Obter o nome do comprador
    const clienteEntity = await strapi.entityService.findOne('api::cliente.cliente', cliente);
    const compradorNome = clienteEntity ? clienteEntity.nome : 'Cliente desconhecido';

    // Retornar a resposta incluindo o nome do comprador
    response.data.attributes.comprador = compradorNome;
    console.log('Pedido criado:', response.data); // Log para verificar o pedido criado
    return response;
  },
  
  // Função auxiliar para obter os nomes dos produtos
  async getProdutos(pedido) {
    if (!pedido.attributes.produtos || !pedido.attributes.produtos.data) {
      return [];
    }

    const produtos = await Promise.all(pedido.attributes.produtos.data.map(async produto => {
      const prod = await strapi.entityService.findOne('api::produto.produto', produto.id);
      return prod ? prod.nome : null;
    }));

    return produtos.filter(Boolean); // Remove produtos null
  },

  // Função auxiliar para obter o nome do comprador
  async getComprador(pedido) {
    if (!pedido.attributes.cliente || !pedido.attributes.cliente.data) {
      return 'Cliente desconhecido';
    }

    const cliente = await strapi.entityService.findOne('api::cliente.cliente', pedido.attributes.cliente.data.id);
    return cliente ? cliente.nome : 'Cliente desconhecido';
  },

// Função para obter todos os pedidos
async find(ctx) {
  const { data, meta } = await super.find(ctx);

  const ped = await Promise.all(data.map(async pedido => {
    const prod = await this.getProdutos(pedido);
    const comprador = await this.getComprador(pedido);

    return {
      id: pedido.id,
      data_ped: pedido.attributes.data_ped,
      valor: pedido.attributes.valor,
      status: pedido.attributes.status,
      comprador: comprador,
      produtos: prod
    };
  }
  ));
  return { data: ped, meta };
}
}));