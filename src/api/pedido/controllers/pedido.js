// 'use strict';

// const { createCoreController } = require('@strapi/strapi').factories;

// module.exports = createCoreController('api::pedido.pedido', ({ strapi }) => ({
//   async find(ctx) {
//     // Ajustar a consulta para popular os relacionamentos necessários, como cliente e itens/produtos
//     const { data, meta } = await super.find(ctx, {
//       populate: ['clientes', 'produtos']
//     });

//     // Função para calcular o valor total do pedido
//     const calcularValorTotal = pedido => {
//       if (!pedido.produtos || pedido.produtos.length === 0) {
//         return 0;
//       } else {
//         return pedido.produtos.reduce((acc, produto) => acc + produto.preco, 0);
//       }
//     };

//     // Função para mapear os pedidos para o formato desejado
//     const mapearPedido = pedido => ({
//       id: pedido.id,
//       codigoCliente: pedido.cod_cli,
//       itensPedido: pedido.produtos.map(produto => ({
//           id: produto.id,
//           nome: produto.nome, 
//           preco: produto.preco
//       })),
//       data: pedido.data_ped,
//       valor: calcularValorTotal(pedido)
//     });

//     // Mapear os dados para customizar a resposta
//     //const customizedPedidos = data.map(mapearPedido);

//     //return { data: customizedPedidos, meta };
//     return { data, mapearPedido };
//   }
// }));
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pedido.pedido', ({ strapi }) => ({
  // Função para criar um novo pedido
  async create(ctx) {
    const { data } = ctx.request.body;
    const { produtos, cliente } = data;

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
      if (produto) {
        await strapi.entityService.update('api::produto.produto', produtoId, {
          data: {
            Qtd_estoque: produto.Qtd_estoque - 1,
          },
        });
      }
    }

    return response;
  },

  // Função para obter todos os pedidos
  async find(ctx) {
    const { data, meta } = await super.find(ctx);

    const pedidos = await Promise.all(data.map(async pedido => {
      let produtos = [];
      if (pedido.attributes.produtos && pedido.attributes.produtos.data) {
        produtos = await Promise.all(pedido.attributes.produtos.data.map(async produto => {
          const produtoEntity = await strapi.entityService.findOne('api::produto.produto', produto.id);
          return produtoEntity ? produtoEntity.Nome : null;
        }));
      }

      let comprador = 'Cliente desconhecido';
      if (pedido.attributes.cliente && pedido.attributes.cliente.data) {
        const clienteEntity = await strapi.entityService.findOne('api::cliente.cliente', pedido.attributes.cliente.data.id);
        comprador = clienteEntity ? clienteEntity.Nome : 'Cliente desconhecido';
      }

      return {
        id: pedido.id,
        data_ped: pedido.attributes.data_ped,
        valor: pedido.attributes.valor,
        status: pedido.attributes.status,
        comprador,
        produtos: produtos.filter(Boolean), // Remove produtos null
      };
    }));

    return { data: pedidos, meta };
  },
}));
