const { io } = require("../server");
const Usuarios = require("../classes/usuarios");
const { crearMensaje } = require("../utilidades/utilidades");

const usuarios = new Usuarios();

io.on("connection", (client) => {
  client.on("entrarChat", (data, callback) => {
    if (!data.nombre || !data.sala) {
      return callback && typeof callback === "function"
        ? callback({
            error: true,
            mensaje: "El nombre/sala es necesario",
          })
        : null;
    }

    client.join(data.sala);

    usuarios.agregarPersona(client.id, data.nombre, data.sala);
    client.broadcast
      .to(data.sala)
      .emit("listaPersonas", usuarios.gerPersonaPorSala(data.sala));
      client.broadcast
      .to(data.sala)
      .emit(
        "crearMensaje",
        crearMensaje("Administrador", `${data.nombre} se unio`)
      );
    callback && typeof callback === "function"
      ? callback(usuarios.gerPersonaPorSala(data.sala))
      : null;
  });

  client.on("crearMensaje", (data, callback) => {
    let persona = usuarios.getPersona(client.id);

    let mensaje = crearMensaje(persona.nombre, data.mensaje);
    client.broadcast.to(persona.sala).emit("crearMensaje", mensaje);
    callback(mensaje);
  });

  client.on("disconnect", () => {
    let personaBorrada = usuarios.borrarPersona(client.id);
    client.broadcast
      .to(personaBorrada.sala)
      .emit(
        "crearMensaje",
        crearMensaje(
          "Administrador",
          `${personaBorrada.nombre} abandono el chat`
        )
      );
    client.broadcast
      .to(personaBorrada.sala)
      .emit("listaPersonas", usuarios.gerPersonaPorSala(personaBorrada.sala));
  });

  //Mensajes Privados
  client.on("mensajePrivado", (data) => {
    let persona = usuarios.getPersona(client.id);
    client.broadcast
      .to(data.para)
      .emit("mensajePrivado", crearMensaje(persona.nombre, data.mensaje));
  });
});
