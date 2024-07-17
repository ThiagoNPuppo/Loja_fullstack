'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pedido.pedido', ({ strapi }) => ({
  // Função para criar um novo pedido
  async create(ctx) {
    const { data } = ctx.request.body;
    const { produtos } = data;

    // Calcula o valor total do pedido
    let valorTotal = 0;
    for (const produtoId of produtos) {
      const produto = await strapi.entityService.findOne('api::produto.produto', produtoId);
      if (produto) {
        valorTotal += produto.Preco;
      }
    }

    // Atualiza o campo 'valor' com o valor total calculado
    data.valor = valorTotal;

    // Chama a função de criação padrão do Strapi
    const response = await super.create(ctx);

    // Atualiza o estoque dos produtos
    for (const produtoId of produtos) {
      const produto = await strapi.entityService.findOne('api::produto.produto', produtoId);
      if (produto.Qtd_estoque > 0) {
        await strapi.entityService.update('api::produto.produto', produtoId, {
          data: {
            Qtd_estoque: produto.Qtd_estoque - 1,
          },
        });
      } else {
        return ctx.badRequest(`Produto ${produto.Nome} está fora de estoque.`);
      }
    }

    return response;
  },

  // Função para obter todos os pedidos
  async find(ctx) {
    const { data, meta } = await super.find(ctx);

    console.log('Pedidos encontrados:', data); // Log para verificar os pedidos encontrados

    const pedidos = await Promise.all(data.map(async pedido => {
      const produtos = await this.getProdutos(pedido);
      const comprador = await this.getComprador(pedido);

      console.log('Pedido processado:', {
        id: pedido.id,
        data_ped: pedido.attributes.data_ped,
        valor: pedido.attributes.valor,
        status: pedido.attributes.status,
        comprador,
        produtos,
      }); // Log para verificar o pedido processado

      return {
        id: pedido.id,
        data_ped: pedido.attributes.data_ped,
        valor: pedido.attributes.valor,
        status: pedido.attributes.status,
        comprador,
        produtos,
      };
    }));

    return { data: pedidos, meta };
  },

  // Função auxiliar para obter os nomes dos produtos
  async getProdutos(pedido) {
    console.log('Obtendo produtos para o pedido:', pedido.id);

    if (!pedido.attributes.produtos || !pedido.attributes.produtos.data) {
      console.log('Nenhum produto encontrado para o pedido:', pedido.id);
      return [];
    }

    const produtos = await Promise.all(pedido.attributes.produtos.data.map(async produto => {
      console.log('Produto ID:', produto.id);
      const produtoEntity = await strapi.entityService.findOne('api::produto.produto', produto.id);
      console.log('Produto encontrado:', produtoEntity);
      return produtoEntity ? produtoEntity.Nome : null;
    }));

    return produtos.filter(Boolean); // Remove produtos null
  },

  // Função auxiliar para obter o nome do comprador
  async getComprador(pedido) {
    if (!pedido.attributes.cliente || !pedido.attributes.cliente.data) {
      console.log('Cliente desconhecido, dados do cliente ausentes');
      return 'Cliente desconhecido';
    }

    const clienteId = pedido.attributes.cliente.data.id;
    console.log('Buscando cliente com ID:', clienteId);

    try {
      const clienteEntity = await strapi.entityService.findOne('api::cliente.cliente', clienteId);

      if (!clienteEntity) {
        console.log('Cliente não encontrado para ID:', clienteId);
        return 'Cliente desconhecido';
      }

      console.log('Cliente encontrado:', clienteEntity);
      return clienteEntity.Nome;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return 'Cliente desconhecido';
    }
  }
}));

// 'use strict';

// const { createCoreController } = require('@strapi/strapi').factories;

// module.exports = createCoreController('api::pedido.pedido', ({ strapi }) => ({
//   // Função para criar um novo pedido
//   async create(ctx) {
//     const { data } = ctx.request.body;
//     const { produtos, cliente } = data;

//     // Calcula o valor total do pedido
//     let valorTotal = 0;
//     for (const produtoId of produtos) {
//       const produto = await strapi.entityService.findOne('api::produto.produto', produtoId);
//       if (produto) {
//         valorTotal += produto.Preco;
//       }
//     }

//     // Atualiza o campo 'valor' com o valor total calculado
//     data.valor = valorTotal;

//     // Chama a função de criação padrão do Strapi
//     const response = await super.create(ctx);

//     // Atualiza o estoque dos produtos
//     for (const produtoId of produtos) {
//       const produto = await strapi.entityService.findOne('api::produto.produto', produtoId);
//       if (produto.Qtd_estoque > 0) {
//         await strapi.entityService.update('api::produto.produto', produtoId, {
//           data: {
//             Qtd_estoque: produto.Qtd_estoque - 1,
//           },
//         });
//       } else {
//         return ctx.badRequest(`Produto ${produto.Nome} está fora de estoque.`);
//       }
//     }

//     return response;
//   },

//   // Função para obter todos os pedidos
//   async find(ctx) {
//     const { data, meta } = await super.find(ctx);

//     const pedidos = await Promise.all(data.map(async pedido => {
//       const produtos = await this.getProdutos(pedido);
//       const comprador = await this.getComprador(pedido);

//       return {
//         id: pedido.id,
//         data_ped: pedido.attributes.data_ped,
//         valor: pedido.attributes.valor,
//         status: pedido.attributes.status,
//         comprador,
//         produtos,
//       };
//     }));

//     return { data: pedidos, meta };
//   },

//   // Função auxiliar para obter os nomes dos produtos
//   async getProdutos(pedido) {
//     if (!pedido.attributes.produtos || !pedido.attributes.produtos.data) {
//       return [];
//     }

//     const produtos = await Promise.all(pedido.attributes.produtos.data.map(async produto => {
//       const produtoEntity = await strapi.entityService.findOne('api::produto.produto', produto.id);
//       return produtoEntity ? produtoEntity.Nome : null;
//     }));

//     return produtos.filter(Boolean); // Remove produtos null
//   },

//   // Função auxiliar para obter o nome do comprador
//   async getComprador(pedido) {
//     if (!pedido.attributes.cliente || !pedido.attributes.cliente.data) {
//       return 'Cliente desconhecido';
//     }

//     const clienteEntity = await strapi.entityService.findOne('api::cliente.cliente', pedido.attributes.cliente.data.id);
    
//     // Adicionando log para depuração
//     console.log('Cliente Entity:', clienteEntity);
    
//     return clienteEntity ? clienteEntity.Nome : 'Cliente desconhecido';
//   }
// }));