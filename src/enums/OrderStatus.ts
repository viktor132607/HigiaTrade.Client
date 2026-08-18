export enum OrderStatus {
  Created,
  PendingVerification,
  Verified,
  Processing,
  Shipped,
  Delivered,
  Cancelled,
}

export const getOrderStatusText = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.Created:
      return "Draft";
    case OrderStatus.PendingVerification:
      return "Pending review";
    case OrderStatus.Verified:
      return "Verified";
    case OrderStatus.Processing:
      return "Processing";
    case OrderStatus.Shipped:
      return "Shipped";
    case OrderStatus.Delivered:
      return "Delivered";
    case OrderStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.Created:
      return "bg-yellow-100 text-yellow-800";
    case OrderStatus.PendingVerification:
      return "bg-purple-100 text-purple-800";
    case OrderStatus.Verified:
      return "bg-blue-100 text-blue-800";
    case OrderStatus.Processing:
      return "bg-indigo-100 text-indigo-800";
    case OrderStatus.Shipped:
      return "bg-cyan-100 text-cyan-800";
    case OrderStatus.Delivered:
      return "bg-green-100 text-green-800";
    case OrderStatus.Cancelled:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const OrderStatusOptions = [
  {
    value: OrderStatus.Created,
    label: getOrderStatusText(OrderStatus.Created),
    color: getOrderStatusColor(OrderStatus.Created),
  },
  {
    value: OrderStatus.PendingVerification,
    label: getOrderStatusText(OrderStatus.PendingVerification),
    color: getOrderStatusColor(OrderStatus.PendingVerification),
  },
  {
    value: OrderStatus.Verified,
    label: getOrderStatusText(OrderStatus.Verified),
    color: getOrderStatusColor(OrderStatus.Verified),
  },
  {
    value: OrderStatus.Processing,
    label: getOrderStatusText(OrderStatus.Processing),
    color: getOrderStatusColor(OrderStatus.Processing),
  },
  {
    value: OrderStatus.Shipped,
    label: getOrderStatusText(OrderStatus.Shipped),
    color: getOrderStatusColor(OrderStatus.Shipped),
  },
  {
    value: OrderStatus.Delivered,
    label: getOrderStatusText(OrderStatus.Delivered),
    color: getOrderStatusColor(OrderStatus.Delivered),
  },
  {
    value: OrderStatus.Cancelled,
    label: getOrderStatusText(OrderStatus.Cancelled),
    color: getOrderStatusColor(OrderStatus.Cancelled),
  },
];
