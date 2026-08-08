import type { ListItem } from "@/types/listItem";

export const defaultListItems: ListItem[] = [
  {
    id: 1,
    boothId: "C18",
    enabled: true,
    priority: 1,
    authorNames: ["示例作者"],
    purchaseItems: [
      {
        authorName: "示例作者",
        itemName: "示例商品",
        price: 100,
        enabled: true,
      },
    ],
    exchangeGifts: [
      {
        authorName: "示例作者",
        itemName: "示例認親禮1",
        enabled: true,
      },
    ],
    tags: ["tagA", "tagB", "tagC", "tagD", "tagE"],
    style: "default",
    note: "這是備註。",
  },
  {
    id: 10,
    boothId: "C17",
    enabled: true,
    priority: 1,
    authorNames: ["關於統計（見備註）"],
    purchaseItems: [
      {
        authorName: "作者A",
        itemName: "商品A",
        price: 300,
        enabled: true,
      },
      {
        authorName: "作者B",
        itemName: "商品B",
        price: 100,
        enabled: false,
      },
    ],
    exchangeGifts: [
      {
        authorName: "作者A",
        itemName: "認親禮1",
        enabled: true,
      },
      {
        authorName: "作者B",
        itemName: "認親禮2",
        enabled: false,
      },
    ],
    tags: [],
    style: "default",
    note: "統計都是以有勾選的為主，如果購買項目或認親禮取消勾選，就不會納入統計。\n同樣的，如果整攤取消勾選（=已去過），那整攤的東西都不會納入統計。",
  },
  {
    id: 11,
    boothId: "C16",
    enabled: true,
    priority: 1,
    authorNames: ["關於認親禮統計（見備註）"],
    purchaseItems: [],
    exchangeGifts: [
      {
        authorName: "示例作者",
        itemName: "示例認親禮1",
        enabled: true,
      },
      {
        authorName: "示例作者",
        itemName: "示例認親禮2",
        enabled: true,
      },
    ],
    tags: [],
    style: "default",
    note: "認親禮計數因為是用來計算總共要準備幾份認親禮用的，所以是以「作者人數」為單位下去算。同攤位有複數作者要送，記得要填作者名，以免合併計算。",
  },
  {
    id: 2,
    boothId: "A12",
    enabled: true,
    priority: 5,
    authorNames: ["作者甲", "作者乙", "作者丙"],
    purchaseItems: [
      {
        authorName: "作者甲",
        itemName: "合同誌A",
        price: 350,
        enabled: true,
      },
      {
        authorName: "作者乙",
        itemName: "合同誌B",
        price: 280,
        enabled: true,
      },
      {
        authorName: "作者丙",
        itemName: "周邊小卡組",
        price: 150,
        enabled: false,
      },
    ],
    exchangeGifts: [
      {
        authorName: "作者甲",
        itemName: "限定書籤",
        enabled: true,
      },
      {
        authorName: "作者乙",
        itemName: "限定書籤",
        enabled: true,
      },
      {
        authorName: "作者丙",
        itemName: "限定書籤",
        enabled: true,
      },
    ],
    tags: ["tagA", "tagB"],
    style: "red",
    note: "",
  },
  {
    id: 3,
    boothId: "B07",
    enabled: false,
    priority: 2,
    authorNames: ["作者丁"],
    purchaseItems: [
      {
        authorName: "",
        itemName: "本子",
        price: 200,
        enabled: true,
      },
    ],
    exchangeGifts: [
      {
        authorName: "",
        itemName: "簽名色紙",
        enabled: true,
      },
    ],
    tags: ["tagD"],
    style: "amber",
    note: "已經去過了=取消啟用，會變成灰色的",
  },
  {
    id: 4,
    boothId: "C23",
    enabled: true,
    priority: 10,
    authorNames: ["作者戊"],
    purchaseItems: [],
    exchangeGifts: [],
    tags: [],
    style: "sky",
    note: "",
  },
  {
    id: 5,
    boothId: "D45",
    enabled: true,
    priority: 3,
    authorNames: ["作者己", "作者庚"],
    purchaseItems: [
      {
        authorName: "作者己",
        itemName: "壓克力吊飾",
        price: 320,
        enabled: true,
      },
      {
        authorName: "作者庚",
        itemName: "壓克力吊飾",
        price: 320,
        enabled: true,
      },
    ],
    exchangeGifts: [
      {
        authorName: "作者己",
        itemName: "認親禮1",
        enabled: false,
      },
    ],
    tags: ["tagB", "tagE"],
    style: "violet",
    note: "",
  },
];
