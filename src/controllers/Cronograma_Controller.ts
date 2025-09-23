import { Request, Response } from "express";
import Cronograma from "../models/Cronograma";
import Equipo from "../models/equipo";
import { Op } from "sequelize";
import Deportista from "../models/deportista";
import Asistencia from "../models/asistencia";
import moment from "moment-timezone";

export class Cronograma_Controller {
  static traer_Cronogramas = async (req: Request, res: Response) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const cronogramas = await Cronograma.findAll({
        where: {fecha: { [Op.gte]: hoy },},
        order: [["fecha", "ASC"]],
        include: [
          { model: Equipo },
          { model: Asistencia, include: [Deportista], },
        ],
      });

      const respuesta = cronogramas.map((cronograma) => {
        const datos = {
          ...cronograma.toJSON(),
          nombre_Equipo: cronograma.equipo?.nombre_Equipo,
          categoria: cronograma.equipo?.categoria,
          asistencias: cronograma.asistencias?.map((a) => ({
            ID_Asistencia: a.ID_Asistencia,
            estado: a.estado,
            observaciones: a.observaciones,
            ID_Deportista: a.ID_Deportista,
            deportista: a.deportista
              ? {
                  ID_Deportista: a.deportista.ID_Deportista,
                  nombre_Completo: a.deportista.nombre_Completo,
                }
              : null,
          })),
        };

        delete datos.equipo;
        delete datos.asistencia;

        return datos;
      });

      console.log(respuesta);
      res.json(respuesta);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Hubo un error al traer los cronogramas" });
    }
  };

  static traer_Cronogramas_Por_Equipo = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const cronogramas = await Cronograma.findAll({
        where: {
          ID_Equipo: id,
          fecha: { [Op.gte]: hoy },
        },
        order: [["fecha", "ASC"]],
        include: [{ model: Equipo }],
      });

      if (!cronogramas.length) {
        return res
          .status(404)
          .json({ error: "No se encontraron cronogramas para este equipo" });
      }

      const respuesta = cronogramas.map((c) => {
        const datos = {
          ...c.toJSON(),
          nombre_Equipo: c.equipo?.nombre_Equipo,
          categoria: c.equipo?.categoria,
        };
        delete datos.equipo;
        return datos;
      });

      res.json(respuesta);
    } catch (error) {
      res.status(500).json({ error: "Hubo un error al traer los cronogramas" });
    }
  };

  static traer_Cronograma_Por_Id = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const cronograma = await Cronograma.findByPk(id, {
        include: [
          { model: Equipo },{model: Asistencia,include: [Deportista],},
        ],
      });
      if (!cronograma) {
        return res.status(404).json({ error: "cronograma no encontrado" });
      }

      // Transformamos la respuesta
      const datos = {
        ...cronograma.toJSON(),
        asistencia: {
          ID_Cronograma: cronograma.ID_Cronograma,
          deportistas: cronograma.asistencias.map((a) => ({
            ID_Deportista: a.deportista.ID_Deportista,
            nombre_Completo: a.deportista.nombre_Completo,
            estado: a.estado,
            observaciones: a.observaciones,
          })),
        },
      };

      // eliminamos la lista plana de asistencias
      delete datos.asistencias;

      res.json(datos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Hubo un error al traer el cronograma" });
    }
  };

  static traer_cronogramaEntrenador_Por_Id = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { ID_Entrenador } = req.params;

      const cronogramas = await Cronograma.findAll({
        where: { ID_Entrenador },
        include: [
          {model: Equipo, include: [{ model: Deportista }], },
        ],
      });

      if (!cronogramas || cronogramas.length === 0) {
        return res.status(404).json({error: "No se encontraron cronogramas para este entrenador",});
      }res.json(cronogramas);
    } catch (error) { console.error(error);
      res.status(500).json({ error: "Hubo un error al traer los cronogramas" });
    }
  };

  static reporteFlexible = async (req: Request, res: Response) => {
    const { ID_Equipo } = req.params;
    const { periodo, start, end } = req.query as {
      periodo?: string;
      start?: string;
      end?: string;
    };
    let fechaInicio: string;
    let fechaFin: string;
    const hoy = moment().format("YYYY-MM-DD");

    if (periodo === "dia") {
      fechaInicio = start || hoy; fechaFin = start || hoy;
    } else if (periodo === "semana") {
      const mStart = start ? moment(start) : moment();
      fechaInicio = mStart.startOf("isoWeek").format("YYYY-MM-DD");
      fechaFin = mStart.endOf("isoWeek").format("YYYY-MM-DD");
    } else if (periodo === "mes") {
      const mStart = start ? moment(start) : moment();
      fechaInicio = mStart.startOf("month").format("YYYY-MM-DD");
      fechaFin = mStart.endOf("month").format("YYYY-MM-DD");
    } else if (start && end) {
      fechaInicio = start;
      fechaFin = end;
    } else {
      return res.status(400).json({ message: "Periodo no válido" });
    }

    try {
      const eventos = await Cronograma.findAll({
        where: { ID_Equipo,fecha: { [Op.between]: [fechaInicio, fechaFin] },},
        include: [
          { model: Asistencia,include: [{ model: Deportista, attributes: ["nombre_Completo"] }],},
        ],order: [["fecha", "ASC"]],
      });

      const reporte = eventos.map((evento) => ({
        fecha: evento.fecha,
        nombre_Evento: evento.nombre_Evento, // 👈 ahora sí el nombre del evento
        descripcion: evento.descripcion, // 👈 puedes enviar también la descripción
        asistencias: evento.asistencias.map((a) => ({
          nombre_Deportista: a.deportista?.nombre_Completo, // 👈 consistente con el frontend
          estado: a.estado,
          observaciones: a.observaciones || "",
        })),
      }));

      res.json(reporte);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generando reporte" });
    }
  };

  static reporteFlexibleDeportista = async (req: Request, res: Response) => {
    const { ID_Deportista } = req.params;
    const { periodo, start, end } = req.query as { periodo?: string; start?: string; end?: string };

    let fechaInicio: string, fechaFin: string;
    const hoy = moment().format("YYYY-MM-DD");

    if (periodo === "dia") {
      fechaInicio = start || hoy;
      fechaFin = start || hoy;
    } else if (periodo === "semana") {
      const mStart = start ? moment(start) : moment();
      fechaInicio = mStart.startOf("isoWeek").format("YYYY-MM-DD");
      fechaFin = mStart.endOf("isoWeek").format("YYYY-MM-DD");
    } else if (periodo === "mes") {
      const mStart = start ? moment(start) : moment();
      fechaInicio = mStart.startOf("month").format("YYYY-MM-DD");
      fechaFin = mStart.endOf("month").format("YYYY-MM-DD");
    } else if (start && end) {
      fechaInicio = start;
      fechaFin = end;
    } else return res.status(400).json({ message: "Periodo no válido" });

    try {
      const eventos = await Cronograma.findAll({
        where: { fecha: { [Op.between]: [fechaInicio, fechaFin] } },
        include: [
          { model: Asistencia,where: { ID_Deportista },
            include: [{ model: Deportista, attributes: ["nombre_Completo"] }],required: true,
          },
        ],order: [["fecha", "ASC"]],
      });

      const reporte = eventos.map((evento) => ({
        fecha: evento.fecha,
        nombre_Evento: evento.nombre_Evento,
        descripcion: evento.descripcion || "",
        asistencias: evento.asistencias.map((a) => ({
          nombre_Deportista: a.deportista?.nombre_Completo,
          estado: a.estado,
          observaciones: a.observaciones || "",
        })),
      })); res.json(reporte);
    } catch (error) {
      console.error("Error generando reporte de deportista:", error);
      res.status(500).json({ message: "Error generando reporte" });
    }
  };

  static crear_Cronograma = async (req: Request, res: Response) => {
    try {
      const nuevo = await Cronograma.create(req.body);
      const equipo = req.body.equipo;
      res
        .status(201)
        .json({ mensaje: "Evento creado correctamente", data: nuevo });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al crear el evento" });
    }
  };

  static actualizar_Cronograma = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const cronograma = await Cronograma.findByPk(id);
      if (!cronograma) {
        const error = new Error("cronograma no encontrado");
        return res.status(404).json({ error: error.message });
      }
      await cronograma.update(req.body);
      res.json("cronograma actualizado correctamente");
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Hubo un error al actualizar elcronograma" });
    }
  };

  static eliminar_Cronograma = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const evento = await Cronograma.findByPk(id);
      if (!evento) return res.status(404).json({ error: "No encontrado" });
      await evento.destroy();
      res.json({ mensaje: "Evento eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar el evento" });
    }
  };
}
