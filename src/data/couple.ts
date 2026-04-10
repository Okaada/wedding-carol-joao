import { CoupleData } from "./types";

export const coupleData: CoupleData = {
  hero: {
    names: "Carol & João",
    date: "24 de outubro de 2026",
    subtitle: "Vamos celebrar o nosso amor",
    image: "/images/espontanea-mar.jpeg",
  },
  timeline: [
    {
      date: "2016",
      title: "Como tudo começou",
      description:
        "Nos conhecemos no ensino médio e, entre olhares e conversas, algo especial foi nascendo — mas nenhum dos dois tinha coragem de dar o primeiro passo. Até que o destino resolveu agir: Julia, a melhor amiga da Carol, pegou o celular e mandou um 'OOOIIII' bem corajoso pro João. E foi assim, de forma leve e divertida, que tudo começou.",
      image: "/images/timeline-01.svg",
    },
    {
      date: "27 de fevereiro de 2017",
      title: "O início do namoro",
      description:
        "Depois daquela mensagem, as conversas não pararam mais. Cada dia o assunto rendia mais, e o que começou como amizade foi se transformando em algo que nenhum dos dois conseguia ignorar. Em 27 de fevereiro de 2017, decidimos que era oficial: estávamos juntos.",
      image: "/images/timeline-02.svg",
    },
    {
      date: "2017 – 2024",
      title: "Juntos, mesmo à distância",
      description:
        "Ensino médio, vestibular, faculdade, mudanças de cidade, estágios, TCC, início de carreira... ao longo desses 7 anos, a vida foi nos levando por caminhos diferentes, mas o nosso relacionamento nunca deixou de ser prioridade. Mesmo à distância, o amor só ficou mais forte — entre ligações longas, saudade e muita cumplicidade.",
      image: "/images/timeline-03.svg",
    },
    {
      date: "2024",
      title: "Finalmente na mesma cidade",
      description:
        "Em 2024, depois de anos mesmo com a distância, nossas rotinas finalmente se cruzaram em Matão. Poder estar juntos no dia a dia, sem contar os quilômetros, nos mostrou com ainda mais certeza o que já sabíamos: queríamos dividir a vida inteira, um do lado do outro.",
      image: "/images/timeline-04.svg",
    },
    {
      date: "26 de janeiro de 2025",
      title: "O pedido",
      description:
        "No show da banda favorita da Carol, enquanto tocava a música que ela mais ama, João fez a pergunta mais importante da sua vida. E entre lágrimas, sorrisos e o som da multidão, veio a resposta mais linda: SIM!",
    },
    {
      date: "24 de outubro de 2026",
      title: "O grande dia",
      description:
        "Depois de tantos anos de história, chegou o momento de celebrar o nosso amor com as pessoas mais especiais das nossas vidas. Que venha essa nova fase — juntos, como sempre foi.",
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
  weddingDay: {
    date: "24 de outubro de 2026",
    time: "16h",
    ceremony: {
      name: "Paróquia Santa Cruz",
      address: "Rua Sinharinha Frota, 1772, Jardim Buscardi",
      embedUrl:
        "https://maps.google.com/maps?q=Rua+Sinharinha+Frota,+1772,+Jardim+Buscardi,+SP,+Brasil&output=embed",
      mapUrl:
        "https://maps.google.com/maps?q=Rua+Sinharinha+Frota,+1772,+Jardim+Buscardi,+SP,+Brasil",
    },
    reception: {
      name: "Radaelli Eventos",
      start: "Início após a cerimônia",
      end: "Término às 01h00",
      embedUrl:
        "https://maps.google.com/maps?q=Radaelli+Eventos+Jardim+Buscardi&output=embed",
      mapUrl: "https://maps.app.goo.gl/aA2FqgRfxcsLLbUD6?g_st=ic",
    },
  },
};
