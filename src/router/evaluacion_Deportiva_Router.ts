import { Router } from 'express';
import { param } from 'express-validator';
import { EvaluacionDeportiva_controller } from '../controllers/evaluacion_Deportiva_Controller';
import {validar_Evaluacion_Deportiva_body,validar_Evaluacion_Deportiva_Existente} from '../middelware/evaluacion_Deportiva_Mild';
import { handleInputErrors } from '../middelware/Validation';

const router = Router();

router.get('/', EvaluacionDeportiva_controller.traer_EvaluacionesDeportivas);

router.get('/:id',

  handleInputErrors,
  EvaluacionDeportiva_controller.traer_EvaluacionDeportiva_Por_Id
);

router.post('/',
  validar_Evaluacion_Deportiva_body,
  handleInputErrors,
  EvaluacionDeportiva_controller.crear_EvaluacionDeportiva
);

router.put('/:id',

  validar_Evaluacion_Deportiva_body,
  handleInputErrors,
  EvaluacionDeportiva_controller.actualizar_EvaluacionDeportiva_Por_Id
);

router.delete('/:id',
  param('id').isInt().withMessage('ID NO VALIDO')
    .custom(value => value > 0).withMessage('ID NO VALIDO'),
  handleInputErrors,
  EvaluacionDeportiva_controller.eliminar_EvaluacionDeportiva_Por_Id
);

export default router;