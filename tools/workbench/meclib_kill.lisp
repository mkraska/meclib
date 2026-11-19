;;; meclib_kill('[a, b, ...]): kill() of the names a question assigned in an earlier run of the
;;; same Maxima session, except Maxima's option variables (simp, ratprint, display2d, ...): kill()
;;; unbinds those, and Maxima 5.48.1 does not survive kill(simp) ("The variable $SIMP is unbound",
;;; the run never ends; TM3 09 02, 2026-11-18). Every run of the workbench sets the options it
;;; needs at its start, so they need no reset here. Loaded by maxima_session.py.

(defun meclib-kill-option-p (s)
  (and (boundp '*variable-initial-values*)
       (nth-value 1 (gethash s *variable-initial-values*))))

(defun $meclib_kill (l)
  (dolist (s (if (and (consp l) (eq (caar l) 'mlist)) (cdr l) (list l)))
    (when (and (symbolp s) (not (meclib-kill-option-p s)))
      (meval `(($kill) ,s))))
  '$done)
