import { Request, Response } from "express";
import Cronograma from "../models/Cronograma";
import Equipo from "../models/equipo";
import { Op } from "sequelize";
import Deportista from "../models/deportista";

export class Cronograma_Controller {
  static traer_Cronogramas = async (req: Request, res: Response) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const cronogramas = await Cronograma.findAll({
        where: {
          fecha: {
            [Op.gte]: hoy,
          },
        },
        order: [["fecha", "ASC"]],
        include: [{ model: Equipo }],
      });
      const respuesta = cronogramas.map((cronograma) => {
        const datos = {
          ...cronograma.toJSON(),
          nombre_Equipo: cronograma.equipo.nombre_Equipo,
          categoria: cronograma.equipo.categoria,
        };
        delete datos.equipo;
        return datos;
      });
      console.log(respuesta);
      res.json(respuesta);
    } catch (error) {
      //console.log(error)
      res
        .status(500)
        .json({ error: "Hubo un error al traer los entrenadores" });
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
      return res.status(404).json({ error: "No se encontraron cronogramas para este equipo" });
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
      const cronograma = await Cronograma.findByPk(id);
      if (!cronograma) {
        const error = new Error("cronograma no encontrado");
        return res.status(404).json({ error: error.message });
      }
      res.json(cronograma);
    } catch (error) {
      res.status(500).json({ error: "Hubo un error al traer el cronograma" });
    }
  };

  static traer_cronogramaEntrenador_Por_Id = async (req: Request, res: Response) => {
  try {
    const { ID_Entrenador } = req.params;

    const cronogramas = await Cronograma.findAll({
      where: { ID_Entrenador },
      include: [
        {
          model: Equipo, // si un cronograma está asociado a un equipo
          include: [{ model: Deportista}], // si quieres también traer los deportistas de ese equipo
        },
      ],
    });

    if (!cronogramas || cronogramas.length === 0) {
      return res.status(404).json({ error: "No se encontraron cronogramas para este entrenador" });
    }

    res.json(cronogramas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Hubo un error al traer los cronogramas" });
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
