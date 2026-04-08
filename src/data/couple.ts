import { CoupleData } from "./types";

export const coupleData: CoupleData = {
  hero: {
    names: "Carol & João",
    date: "15 de Novembro de 2026",
    subtitle: "Vamos celebrar o nosso amor",
    image: "/images/hero-couple.svg",
  },
  timeline: [
    {
      date: "Março de 2018",
      title: "Como tudo começou",
      description:
        "Nos conhecemos em uma festa de amigos em comum. Foi amor à primeira vista — ou quase. João tropeçou ao se apresentar e Carol não conseguiu parar de rir.",
      image: "/images/timeline-01.svg",
    },
    {
      date: "Junho de 2018",
      title: "Primeiro encontro",
      description:
        "Depois de semanas trocando mensagens, finalmente marcamos um café. O café virou almoço, que virou jantar, que virou uma caminhada até as estrelas aparecerem.",
      image: "/images/timeline-02.svg",
    },
    {
      date: "Setembro de 2018",
      title: "Início do namoro",
      description:
        "Em um pôr do sol na praia, João pediu Carol em namoro. Ela disse sim antes mesmo dele terminar a frase.",
      image: "/images/timeline-03.svg",
    },
    {
      date: "Dezembro de 2023",
      title: "O pedido de casamento",
      description:
        "Durante uma viagem especial, João planejou tudo nos mínimos detalhes. Com o anel escondido no bolso e o coração acelerado, ele se ajoelhou e fez a pergunta mais importante da sua vida.",
      image: "/images/timeline-04.svg",
    },
    {
      date: "15 de Novembro de 2026",
      title: "O grande dia",
      description:
        "E agora estamos aqui, prontos para celebrar o nosso amor com as pessoas mais especiais das nossas vidas. Que venha essa nova fase!",
    },
  ],
  gallery: [
    { src: "/images/abraco-tenda.jpeg", alt: "Abraço embaixo da tenda" },
    { src: "/images/beijo-mar.jpeg", alt: "Beijo no mar" },
    { src: "/images/caminhando-praia.jpeg", alt: "Caminhando na praia" },
    { src: "/images/espontanea-mar.jpeg", alt: "Momento espontâneo no mar" },
    { src: "/images/pose-ponte.jpeg", alt: "Pose na ponte" },
    { src: "/images/pose-ponte-longe.jpeg", alt: "Pose na ponte ao longe" },
  ],
};
