import type { Request, Response } from "express";
import Evaluacion_Fisica from "../models/evaluacion_Fisica";
import Evaluacion_Tecnica from "../models/evaluacion_Tecnica";
import Evaluacion_Deportiva from "../models/evaluacion_Deportiva";
import Deportista from "../models/deportista";
import Entrenador from "../models/entrenador";

export class EvaluacionDeportiva_controller {
  
 static traer_EvaluacionesDeportivas = async (req: Request, res: Response) => {
    try {
      const evaluaciones = await Evaluacion_Deportiva.findAll({
        include: [
          { model: Evaluacion_Fisica, as: "evaluacion_fisica" },
          { model: Evaluacion_Tecnica, as: "evaluacion_tecnica" },
        ],
        order: [["createdAt", "ASC"]],
      });

      res.json(evaluaciones);
    } catch (error) {
      console.error("Error al traer evaluaciones deportivas:", error);
      res.status(500).json({ error: "Error al traer las evaluaciones deportivas" });
    }
  };

  static traer_EvaluacionesPorDeportista = async (req: Request, res: Response) => {
    try {
      const { ID_Deportista } = req.params;

      const evaluaciones = await Evaluacion_Deportiva.findAll({
        where: { ID_Deportista: ID_Deportista },
        include: [
          { model: Deportista,attributes: ["ID_Deportista", "nombre_Completo","posicion","dorsal"] },
          { model: Entrenador,attributes: ["ID_Entrenador", "nombre_Completo"] },
          { model: Evaluacion_Fisica },
          { model: Evaluacion_Tecnica },
  
        ],
        order: [["fecha", "DESC"]],
      });

      if (!evaluaciones || evaluaciones.length === 0) {
        return res.status(404).json({ error: "No hay evaluaciones para este deportista" });
      }

      res.json(evaluaciones);
    }  catch (error) {
  console.error("Error al traer evaluaciones del deportista:", error);
  res.status(500).json({ error: error instanceof Error ? error.message : error });
}
};

static traer_Evaluaciones_Por_Entrenador = async (req: Request, res: Response) => {
  try {
    const { ID_Entrenador } = req.params;

    const evaluaciones = await Evaluacion_Deportiva.findAll({
      where: { ID_Entrenador },
      include: [
        { model: Entrenador, attributes: ["ID_Entrenador", "nombre_Completo"]},
        { model: Deportista,attributes: ["ID_Deportista", "nombre_Completo","posicion","dorsal"]},
        { model: Evaluacion_Fisica },{ model: Evaluacion_Tecnica },
      ],
      order: [["fecha", "DESC"]],
    });

    if (!evaluaciones.length) {
      return res.status(404).json({ message: "No se encontraron evaluaciones para este entrenador." });
    }

    res.json(evaluaciones);
  } catch (error) {
    console.error("Error al traer evaluaciones del ENTRENADOR:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Error desconocido" });
  }
};

  static traer_Deportistas_Con_Ultima_Evaluacion = async (req: Request, res: Response) => {
    try {
      const { id_entrenador } = req.params;
      const todasEvaluaciones = await Evaluacion_Deportiva.findAll({
        where: { ID_Entrenador: id_entrenador },
        include: [
          { model: Deportista,attributes: ["ID_Deportista", "nombre_Completo","posicion","dorsal"] },
          { model: Entrenador,attributes: ["ID_Entrenador", "nombre_Completo"] },
          { model: Evaluacion_Fisica, as: "evaluacion_fisica" },
          { model: Evaluacion_Tecnica, as: "evaluacion_tecnica" },
          
        ],
        order: [["fecha", "DESC"]],
      });

      const deportistasUnicos = new Map();
      todasEvaluaciones.forEach(evaluacion => {
        const deportistaId = evaluacion.ID_Deportista;
        if (!deportistasUnicos.has(deportistaId)) {
          deportistasUnicos.set(deportistaId, evaluacion);
        }
      });

      res.json(Array.from(deportistasUnicos.values()));
    } catch (error) {
      console.error("Error al traer deportistas únicos:", error);
      res.status(500).json({ error: "Error al traer los deportistas" });
    }
  };


  static traer_EvaluacionDeportiva_Por_Id = async (req: Request, res: Response) => {
    try {
      const evaluacion = await Evaluacion_Deportiva.findByPk(req.params.id, {
        include: [
          { model: Evaluacion_Fisica,},{ model: Evaluacion_Tecnica,},{ model: Deportista, },{ model: Entrenador, },
        ],
      });

      if (!evaluacion) {
        return res.status(404).json({ error: "Evaluación deportiva no encontrada" });
      }

      res.json(evaluacion);
    } catch (error) {
      console.error("Error al traer evaluación deportiva:", error);
      res.status(500).json({ error: "Error al buscar la evaluación deportiva" });
    }
  };
  
  static crear_EvaluacionDeportiva = async (req: Request, res: Response) => {
      try {
        console.log(" Body recibido en /api/evaluacion:", req.body);
        const evaluacion_Deportiva = await Evaluacion_Deportiva.create(req.body);

        await evaluacion_Deportiva.save();
        res.status(201).json({ mensaje: 'La Evaluacion deportiva se ha registrado correctamente' });
      }catch (error) {
  console.error("Error en crear_Evaluacion Deportiva:", error);
  res.status(500).json({ error: 'Hubo un error al registrar la Evaluacion deportiva' });}
}

  static actualizar_EvaluacionDeportiva_Por_Id = async (req: Request, res: Response) => {
    try {
      const evaluacion = await Evaluacion_Deportiva.findByPk(req.params.id);
      if (!evaluacion) return res.status(404).json({ error: 'Evaluación deportiva no encontrada' });
      await evaluacion.update(req.body);
      res.json('Evaluación deportiva actualizada correctamente');
    } catch {
      res.status(500).json({ error: 'Error al actualizar la evaluación deportiva' });
    }
  }

  static eliminar_EvaluacionDeportiva_Por_Id = async (req: Request, res: Response) => {
    try {
      const evaluacion = await Evaluacion_Deportiva.findByPk(req.params.id);
      if (!evaluacion) return res.status(404).json({ error: 'Evaluación deportiva no encontrada' });
      await evaluacion.destroy();
      res.json('Evaluación deportiva eliminada correctamente');
    } catch {
      res.status(500).json({ error: 'Error al eliminar la evaluación deportiva' });
    }
  }
}