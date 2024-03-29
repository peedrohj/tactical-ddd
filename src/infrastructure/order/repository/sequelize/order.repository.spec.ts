import { Sequelize } from "sequelize-typescript";
import Address from "../../../../domain/customer/value-object/address";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import ProductModel from "../../../product/repository/sequelize/product.model";
import OrderRepository from "./order.repository";
import Order from "../../../../domain/checkout/entity/order";
import Product from "../../../../domain/product/entity/product";
import Customer from "../../../../domain/customer/entity/customer";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";

describe("Order repository test", () => {
    let sequelize: Sequelize;
    const orderRepository = new OrderRepository()

    beforeEach(async () => {
        sequelize = new Sequelize({
            dialect: "sqlite",
            storage: ":memory:",
            logging: false,
            sync: { force: true },
        });

        await sequelize.addModels([CustomerModel, OrderModel, OrderItemModel, ProductModel]);
        await sequelize.sync();
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it("should create a new order", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");

        customer.changeAddress(address);
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product = new Product("123", "Product 1", 10);
        await productRepository.create(product);

        const orderItem = new OrderItem(
            "1",
            product.name,
            product.price,
            product.id,
            2
        );
        const order = new Order("123", "123", [orderItem]);
        await orderRepository.create(order);

        const orderModel = await OrderModel.findOne({
            where: { id: order.id },
            include: ["items"],
        });

        expect(orderModel.toJSON()).toStrictEqual({
            id: order.id,
            customer_id: order.customerId,
            total: order.total(),
            items: [
                {
                    id: orderItem.id,
                    name: orderItem.name,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    order_id: order.id,
                    product_id: product.id,
                },
            ],
        });
    })

    it('should update a order', async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");

        customer.changeAddress(address);
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product = new Product("123", "Product 1", 10);
        await productRepository.create(product);

        const orderItem = new OrderItem(
            "1",
            product.name,
            product.price,
            product.id,
            2
        );
        const order = new Order("123", "123", [orderItem]);
        await orderRepository.create(order);

        const orderItem2 = new OrderItem(
            '2',
            product.name,
            product.price,
            product.id,
            2
        );

        order.addItem(orderItem2);
        await orderRepository.update(order)

        const orderModel = await OrderModel.findOne({
            where: { id: order.id },
            include: ['items'],
        })

        expect(orderModel.toJSON()).toStrictEqual({
            id: order.id,
            customer_id: customer.id,
            total: order.total(),
            items: order.items.map((orderItem) => ({
                id: orderItem.id,
                name: orderItem.name,
                price: orderItem.price,
                quantity: orderItem.quantity,
                order_id: order.id,
                product_id: orderItem.productId,
            })),
        })
    })

    it('should find a order', async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("1", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");

        customer.changeAddress(address);
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product = new Product("1", "Product 1", 20);
        await productRepository.create(product);

        const orderItem = new OrderItem(
            "1",
            product.name,
            product.price,
            product.id,
            2
        );
        
        const order = new Order("1", customer.id, [orderItem]);
        await orderRepository.create(order);

        const foundOrder = await orderRepository.find(order.id)

        expect(foundOrder).toStrictEqual(order);
    })

    it('should find all orders', async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("1", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");

        customer.changeAddress(address);
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product = new Product("1", "Product 1", 10);
        await productRepository.create(product);

        const orderItem = new OrderItem(
            "1",
            product.name,
            product.price,
            product.id,
            2
        );
        const order1 = new Order("1", customer.id, [orderItem]);
        await orderRepository.create(order1)

        const orderItem2 = new OrderItem(
            "2",
            product.name,
            product.price,
            product.id,
            2
        );
        const order2 = new Order("2", customer.id, [orderItem2])

        await orderRepository.create(order2)

        const foundOrders = await orderRepository.findAll()
        const orders = [order1, order2]

        expect(foundOrders).toEqual(orders)
    })

});